# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::Places", type: :request do
  describe "POST /api/places" do
    it "creates a place and returns payload" do
      # 概要: 必須項目のみで登録できることを確認する
      # 目的: 登録成功時に保存内容が返ることを担保する
      params = {
        name: "テスト店舗",
        tabelog_url: "https://tabelog.com/tokyo/A0000001/",
        visit_status: "not_visited"
      }

      expect do
        post "/api/places", params: params, as: :json
      end.to change(Place, :count).by(1)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["name"]).to eq("テスト店舗")
      expect(body["tabelog_url"]).to eq("https://tabelog.com/tokyo/A0000001")
      expect(body["visit_status"]).to eq("not_visited")
      expect(body["id"]).to be_present
    end

    it "returns validation errors" do
      # 概要: 必須項目不足で422が返ることを確認する
      # 目的: バリデーション失敗時に理由が返ることを担保する
      params = {
        name: "",
        tabelog_url: "https://tabelog.com/tokyo/A0000001",
        visit_status: "not_visited"
      }

      post "/api/places", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      body = JSON.parse(response.body)
      expect(body["errors"]["name"]).to include("can't be blank")
    end

    it "returns validation errors for missing tabelog_url" do
      # 概要: 食べログURLが未入力で422が返ることを確認する
      # 目的: 必須項目の未入力をAPIでも拒否できることを担保する
      params = {
        name: "テスト店舗",
        tabelog_url: "",
        visit_status: "not_visited"
      }

      post "/api/places", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      body = JSON.parse(response.body)
      expect(body["errors"]["tabelog_url"]).to include("can't be blank")
    end

    it "returns validation errors for non tabelog domain" do
      # 概要: tabelog.com 以外のURLで422が返ることを確認する
      # 目的: URLドメイン制約がAPIでも機能することを担保する
      params = {
        name: "テスト店舗",
        tabelog_url: "https://example.com/shop",
        visit_status: "not_visited"
      }

      post "/api/places", params: params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      body = JSON.parse(response.body)
      expect(body["errors"]["tabelog_url"]).to include("はtabelog.com ドメインのURLを入力してください")
    end

    it "returns existing place when duplicate url" do
      # 概要: URL重複時に409と既存IDが返ることを確認する
      # 目的: 重複登録時の案内情報を返すことを担保する
      existing = Place.create!(
        name: "既存店舗",
        tabelog_url: "https://tabelog.com/tokyo/A0000002",
        visit_status: "visited"
      )

      params = {
        name: "新規",
        tabelog_url: "https://tabelog.com/tokyo/A0000002/",
        visit_status: "not_visited"
      }

      post "/api/places", params: params, as: :json

      expect(response).to have_http_status(:conflict)
      body = JSON.parse(response.body)
      expect(body["errors"]["tabelog_url"]).to include("すでに登録されています")
      expect(body["existing_place_id"]).to eq(existing.id)
    end
  end
end
