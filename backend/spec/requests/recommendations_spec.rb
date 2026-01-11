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
end
