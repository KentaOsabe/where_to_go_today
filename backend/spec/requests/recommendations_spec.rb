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

  it "returns conditions and recommendations" do
    # 概要: 条件と提案結果がレスポンスに含まれることを確認する
    # 目的: APIレスポンスの基本構造を担保する
    place = create_place(name: "候補A")
    primary_candidates = [place]
    recommendations = [{ place: place, reason: "理由テキスト" }]

    recommendation_service = instance_double(RecommendationService, primary_candidates: primary_candidates)
    open_ai_service = instance_double(OpenAiRecommendationService, refine: recommendations)

    allow(RecommendationService).to receive(:new).and_return(recommendation_service)
    allow(OpenAiRecommendationService).to receive(:new).and_return(open_ai_service)

    post "/api/recommendations", params: { genre: "和食", area: "渋谷", price_range: "3000-5000" }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload["conditions"]).to eq(
      "genre" => "和食",
      "area" => "渋谷",
      "price_range" => "3000-5000"
    )
    expect(payload["recommendations"].size).to eq(1)
    expect(payload["recommendations"][0]["place"]["id"]).to eq(place.id)
    expect(payload["recommendations"][0]["reason"]).to eq("理由テキスト")
  end
end
