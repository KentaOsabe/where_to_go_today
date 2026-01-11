# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Recommendations API", type: :request do
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

  it "returns condition_text and recommendations" do
    # 概要: condition_text と提案結果がレスポンスに含まれることを確認する
    # 目的: APIレスポンスの基本構造を担保する
    place = create_place(name: "候補A", updated_at: 2.hours.ago)
    newer_place = create_place(name: "候補B", updated_at: 1.hour.ago)
    recommendations = [{ place: place, reason: "理由テキスト" }]

    open_ai_service = instance_double(OpenAiRecommendationService)

    allow(OpenAiRecommendationService).to receive(:new).and_return(open_ai_service)
    allow(open_ai_service).to receive(:refine) do |primary_candidates:, conditions:|
      expect(primary_candidates.to_a).to eq(Place.order(updated_at: :desc).to_a)
      expect(conditions).to eq(condition_text: "今日は軽めで、駅近。")
      recommendations
    end

    post "/api/recommendations", params: { condition_text: "今日は軽めで、駅近。" }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload["condition_text"]).to eq("今日は軽めで、駅近。")
    expect(payload["recommendations"].size).to eq(1)
    expect(payload["recommendations"][0]["place"]["id"]).to eq(place.id)
    expect(payload["recommendations"][0]["reason"]).to eq("理由テキスト")
  end

  it "returns 422 when condition_text is blank" do
    # 概要: condition_text が未入力の場合に 422 を返す
    # 目的: 必須入力のバリデーションを担保する
    post "/api/recommendations", params: { condition_text: "   " }

    expect(response).to have_http_status(:unprocessable_entity)
    payload = JSON.parse(response.body)
    expect(payload["error"]).to eq("condition_text_required")
  end

  it "returns 500 when OpenAI output is invalid or empty" do
    # 概要: OpenAI出力が不正/空の場合に 500 を返すことを確認する
    # 目的: 不正な提案結果の返却を防ぐ
    place = create_place(name: "候補A")

    response_body = build_response_body({ recommendations: [] }.to_json)
    http = instance_double(Net::HTTP)
    http_response = instance_double(Net::HTTPResponse, code: "200", body: response_body)
    http_client = class_double(Net::HTTP)
    allow(http_client).to receive(:start).and_yield(http)
    allow(http).to receive(:request).and_return(http_response)

    Tempfile.create("openai_apikey") do |file|
      file.write("test-key")
      file.flush

      service = OpenAiRecommendationService.new(api_key_path: file.path, http_client: http_client)
      allow(OpenAiRecommendationService).to receive(:new).and_return(service)

      post "/api/recommendations", params: { condition_text: "今日は軽めで、駅近。" }

      expect(response).to have_http_status(:internal_server_error)
      payload = JSON.parse(response.body)
      expect(payload["error"]).to eq("recommendation_failed")
    end
  end

  it "limits recommendations to 5 and ignores non-candidate ids" do
    # 概要: 最大5件に制限し、候補外IDを除外することを確認する
    # 目的: APIレスポンスが要件に沿った候補のみを返すことを担保する
    places = 6.times.map { |index| create_place(name: "候補#{index + 1}") }
    invalid_id = Place.maximum(:id).to_i + 10

    response_body = build_response_body(
      {
        recommendations: places.map { |place| { id: place.id, reason: "理由#{place.id}" } } + [
          { id: invalid_id, reason: "候補外" }
        ]
      }.to_json
    )

    http = instance_double(Net::HTTP)
    http_response = instance_double(Net::HTTPResponse, code: "200", body: response_body)
    http_client = class_double(Net::HTTP)
    allow(http_client).to receive(:start).and_yield(http)
    allow(http).to receive(:request).and_return(http_response)

    Tempfile.create("openai_apikey") do |file|
      file.write("test-key")
      file.flush

      service = OpenAiRecommendationService.new(api_key_path: file.path, http_client: http_client)
      allow(OpenAiRecommendationService).to receive(:new).and_return(service)

      post "/api/recommendations", params: { condition_text: "今日は軽めで、駅近。" }

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      recommendations = payload.fetch("recommendations", [])
      expect(recommendations.size).to eq(5)
      returned_ids = recommendations.map { |item| item.dig("place", "id") }
      expect(returned_ids).to match_array(places.first(5).map(&:id))
    end
  end
end
