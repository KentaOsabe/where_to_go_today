# frozen_string_literal: true

require "rails_helper"

RSpec.describe OpenAiRecommendationService, type: :service do
  def create_place(attrs = {})
    sequence = SecureRandom.hex(4)
    defaults = {
      name: "テスト店舗#{sequence}",
      tabelog_url: "https://tabelog.com/tokyo/A0000001/#{sequence}",
      visit_status: "visited"
    }

    Place.create!(defaults.merge(attrs))
  end

  def build_response_body(recommendations_json)
    {
      "output" => [
        {
          "content" => [
            {
              "type" => "output_text",
              "text" => recommendations_json
            }
          ]
        }
      ]
    }.to_json
  end

  it "uses OpenAI response and filters invalid ids or missing reasons" do
    # 概要: OpenAIの返却結果を検証し、不正なIDや理由欠落の提案を除外することを確認する
    # 目的: 提案結果の整合性を担保する
    place_a = create_place(name: "候補A", genre: "和食", area: "渋谷")
    place_b = create_place(name: "候補B", genre: "洋食", area: "新宿")

    response_body = build_response_body(
      {
        recommendations: [
          { id: place_a.id, reason: "条件に合っています" },
          { id: place_b.id },
          { id: 9999, reason: "候補外" }
        ]
      }.to_json
    )

    http = instance_double(Net::HTTP)
    response = instance_double(Net::HTTPResponse, code: "200", body: response_body)
    http_client = class_double(Net::HTTP)
    allow(http_client).to receive(:start).and_yield(http)
    allow(http).to receive(:request).and_return(response)

    Tempfile.create("openai_apikey") do |file|
      file.write("test-key")
      file.flush

      service = described_class.new(api_key_path: file.path, http_client: http_client)
      result = service.refine(primary_candidates: [place_a, place_b], conditions: { condition_text: "今日は軽めで、駅近。" })

      expect(result.size).to eq(1)
      expect(result[0][:place]).to eq(place_a)
      expect(result[0][:reason]).to eq("条件に合っています")
    end
  end

  it "limits recommendations to 5 even if OpenAI returns more" do
    # 概要: OpenAIが上限を超える提案を返しても5件以内に制限されることを確認する
    # 目的: 最終結果の上限がAPI要件に合致することを担保する
    places = 6.times.map { |index| create_place(name: "候補#{index + 1}") }

    response_body = build_response_body(
      {
        recommendations: places.map { |place| { id: place.id, reason: "理由#{place.id}" } }
      }.to_json
    )

    http = instance_double(Net::HTTP)
    response = instance_double(Net::HTTPResponse, code: "200", body: response_body)
    http_client = class_double(Net::HTTP)
    allow(http_client).to receive(:start).and_yield(http)
    allow(http).to receive(:request).and_return(response)

    Tempfile.create("openai_apikey") do |file|
      file.write("test-key")
      file.flush

      service = described_class.new(api_key_path: file.path, http_client: http_client)
      result = service.refine(primary_candidates: places, conditions: { condition_text: "静かな雰囲気" })

      expect(result.size).to eq(5)
      expect(result.map { |item| item[:place] }).to eq(places.first(5))
    end
  end

  it "raises an error when OpenAI request fails" do
    # 概要: OpenAIリクエストが失敗した場合にエラーになることを確認する
    # 目的: 不正な提案結果の返却を防ぐ
    place_a = create_place(name: "候補A", genre: "和食", area: "渋谷")
    place_b = create_place(name: "候補B", genre: "洋食", area: "新宿")

    http_client = class_double(Net::HTTP)
    allow(http_client).to receive(:start).and_raise(StandardError, "network error")

    Tempfile.create("openai_apikey") do |file|
      file.write("test-key")
      file.flush

      service = described_class.new(api_key_path: file.path, http_client: http_client)
      expect do
        service.refine(primary_candidates: [place_a, place_b], conditions: { condition_text: "静かな雰囲気" })
      end.to raise_error(described_class::RecommendationError)
    end
  end
end
