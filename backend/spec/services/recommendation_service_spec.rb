# frozen_string_literal: true

require "rails_helper"

RSpec.describe RecommendationService, type: :service do
  def create_place(attrs = {})
    sequence = SecureRandom.hex(4)
    defaults = {
      name: "テスト店舗#{sequence}",
      tabelog_url: "https://tabelog.com/tokyo/A0000001/#{sequence}",
      visit_status: "visited"
    }

    Place.create!(defaults.merge(attrs))
  end

  it "scores by conditions and evaluation info" do
    # 概要: 条件一致と評価情報でスコアリングされることを確認する
    # 目的: ルールベースの優先度付けが想定通り機能することを担保する
    conditions = { genre: "sushi", area: "SHIBUYA", price_range: "3000-5000" }

    top = create_place(
      name: "最優先",
      genre: "Sushi Bar",
      area: "Shibuya",
      price_range: "3000-5000",
      revisit_intent: "yes",
      visit_reason: "ランチで良さそう",
      visit_status: "not_visited"
    )
    mid = create_place(
      name: "次点",
      genre: "Izakaya",
      area: "Shibuya",
      price_range: nil,
      revisit_intent: "unknown",
      visit_reason: "気になる",
      visit_status: "visited"
    )
    low = create_place(
      name: "優先度低",
      genre: "Sushi",
      area: nil,
      price_range: "3000-5000",
      revisit_intent: "no",
      visit_reason: nil,
      visit_status: "visited"
    )

    result = described_class.new(conditions: conditions, scope: Place.all).primary_candidates

    expect(result.first(3)).to eq([top, mid, low])
  end

  it "orders by visit_status and updated_at when scores tie" do
    # 概要: スコア同点時に来店ステータスと更新日時で並ぶことを確認する
    # 目的: 同点時の優先順位ルールを担保する
    not_visited_old = create_place(name: "未訪問(旧)", visit_status: "not_visited")
    not_visited_new = create_place(name: "未訪問(新)", visit_status: "not_visited")
    visited_new = create_place(name: "訪問済(新)", visit_status: "visited")

    not_visited_old.update_columns(updated_at: Time.zone.parse("2026-01-01 10:00:00"))
    not_visited_new.update_columns(updated_at: Time.zone.parse("2026-01-02 10:00:00"))
    visited_new.update_columns(updated_at: Time.zone.parse("2026-01-03 10:00:00"))

    result = described_class.new(conditions: {}, scope: Place.all).primary_candidates

    expect(result.first(3)).to eq([not_visited_new, not_visited_old, visited_new])
  end

  it "handles non-string condition values without error" do
    # 概要: 条件値が文字列以外でもエラーにならないことを確認する
    # 目的: 想定外の入力でも推薦処理が落ちないことを担保する
    place = create_place(
      name: "数値条件",
      price_range: "3000-5000",
      visit_status: "not_visited"
    )

    result = described_class.new(conditions: { price_range: 3000 }, scope: Place.all).primary_candidates

    expect(result.first).to eq(place)
  end

  it "limits primary candidates to 10" do
    # 概要: 一次候補が最大10件に制限されることを確認する
    # 目的: 要件で指定された上限を超えないことを担保する
    12.times { create_place }

    result = described_class.new(conditions: {}, scope: Place.all).primary_candidates

    expect(result.size).to eq(10)
  end
end
