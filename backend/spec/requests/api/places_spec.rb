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

  describe "GET /api/places" do
    before do
      Place.delete_all
    end

    it "returns places ordered by created_at desc" do
      # 概要: 一覧が作成日時の降順で返ることを確認する
      # 目的: 最新の候補が先頭に表示されることを担保する
      base_time = Time.zone.parse("2026-01-01 12:00:00")
      oldest = Place.create!(
        name: "古い店舗",
        tabelog_url: "https://tabelog.com/tokyo/A0001001",
        visit_status: "not_visited"
      )
      middle = Place.create!(
        name: "中間店舗",
        tabelog_url: "https://tabelog.com/tokyo/A0001002",
        visit_status: "not_visited"
      )
      newest = Place.create!(
        name: "新しい店舗",
        tabelog_url: "https://tabelog.com/tokyo/A0001003",
        visit_status: "not_visited"
      )

      oldest.update_columns(created_at: base_time - 2.days, updated_at: base_time - 2.days)
      middle.update_columns(created_at: base_time - 1.day, updated_at: base_time - 1.day)
      newest.update_columns(created_at: base_time, updated_at: base_time)

      get "/api/places"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["places"].map { |row| row["id"] }).to eq([newest.id, middle.id, oldest.id])
      expect(body["pagination"]).to eq(
        {
          "page" => 1,
          "per" => 20,
          "total_count" => 3,
          "total_pages" => 1
        }
      )
    end

    it "paginates by page and per parameters" do
      # 概要: page/per で一覧が分割されることを確認する
      # 目的: ページング操作で表示件数が制御できることを担保する
      base_time = Time.zone.parse("2026-01-02 12:00:00")
      first = Place.create!(
        name: "1件目",
        tabelog_url: "https://tabelog.com/tokyo/A0002001",
        visit_status: "not_visited"
      )
      second = Place.create!(
        name: "2件目",
        tabelog_url: "https://tabelog.com/tokyo/A0002002",
        visit_status: "not_visited"
      )
      third = Place.create!(
        name: "3件目",
        tabelog_url: "https://tabelog.com/tokyo/A0002003",
        visit_status: "not_visited"
      )

      first.update_columns(created_at: base_time - 2.days, updated_at: base_time - 2.days)
      second.update_columns(created_at: base_time - 1.day, updated_at: base_time - 1.day)
      third.update_columns(created_at: base_time, updated_at: base_time)

      get "/api/places", params: { page: 2, per: 1 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["places"].length).to eq(1)
      expect(body["places"].first["id"]).to eq(second.id)
      expect(body["pagination"]).to eq(
        {
          "page" => 2,
          "per" => 1,
          "total_count" => 3,
          "total_pages" => 3
        }
      )
    end

    it "treats page and per below 1 as 1" do
      # 概要: page/per が1未満の場合に最小値で扱われることを確認する
      # 目的: 不正なパラメータでも一覧取得が安定することを担保する
      Place.create!(
        name: "対象店舗",
        tabelog_url: "https://tabelog.com/tokyo/A0003001",
        visit_status: "not_visited"
      )
      Place.create!(
        name: "対象店舗2",
        tabelog_url: "https://tabelog.com/tokyo/A0003002",
        visit_status: "not_visited"
      )

      get "/api/places", params: { page: 0, per: 0 }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["places"].length).to eq(1)
      expect(body["pagination"]).to eq(
        {
          "page" => 1,
          "per" => 1,
          "total_count" => 2,
          "total_pages" => 2
        }
      )
    end

    it "returns pagination even when empty" do
      # 概要: 空配列でもページング情報が返ることを確認する
      # 目的: 空状態の一覧表示に必要な情報を担保する
      get "/api/places"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["places"]).to eq([])
      expect(body["pagination"]).to eq(
        {
          "page" => 1,
          "per" => 20,
          "total_count" => 0,
          "total_pages" => 0
        }
      )
    end
  end
end
