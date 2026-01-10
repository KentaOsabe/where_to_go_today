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

  it "uses OpenAI response, filters invalid ids, and fills missing reasons" do
    # 概要: OpenAIの返却結果を検証し、不正なID除外と理由補完を行うことを確認する
    # 目的: 提案結果の整合性と理由の欠落補正を担保する
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
      result = service.refine(primary_candidates: [place_a, place_b], conditions: { genre: "和食" })

      expect(result.size).to eq(2)
      expect(result[0][:place]).to eq(place_a)
      expect(result[0][:reason]).to eq("条件に合っています")
      expect(result[1][:place]).to eq(place_b)
      expect(result[1][:reason]).to be_present
    end
  end

  it "falls back to primary candidates when OpenAI request fails" do
    # 概要: OpenAIリクエストが失敗した場合にフォールバックすることを確認する
    # 目的: OpenAI利用不可時でも提案が返ることを担保する
    place_a = create_place(name: "候補A", genre: "和食", area: "渋谷")
    place_b = create_place(name: "候補B", genre: "洋食", area: "新宿")

    http_client = class_double(Net::HTTP)
    allow(http_client).to receive(:start).and_raise(StandardError, "network error")

    Tempfile.create("openai_apikey") do |file|
      file.write("test-key")
      file.flush

      service = described_class.new(api_key_path: file.path, http_client: http_client)
      result = service.refine(primary_candidates: [place_a, place_b], conditions: { area: "渋谷" })

      expect(result.map { |item| item[:place] }).to eq([place_a, place_b])
      expect(result.map { |item| item[:reason] }.all?(&:present?)).to be(true)
    end
  end
end
