# frozen_string_literal: true

require "rails_helper"

RSpec.describe Place, type: :model do
  def build_place(attrs = {})
    defaults = {
      name: "テスト店舗",
      tabelog_url: "https://tabelog.com/tokyo/A0000001/",
      visit_status: "not_visited"
    }

    described_class.new(defaults.merge(attrs))
  end

  it "is valid with required fields" do
    # 概要: 必須項目のみで有効になることを確認する
    # 目的: 必須項目が揃えば登録可能であることを担保する
    place = build_place
    expect(place).to be_valid
  end

  it "requires name" do
    # 概要: 店名が空のときに無効になることを確認する
    # 目的: 必須項目の未入力を拒否する
    place = build_place(name: "")
    expect(place).not_to be_valid
    expect(place.errors[:name]).to include("can't be blank")
  end

  it "requires tabelog_url" do
    # 概要: 食べログURLが空のときに無効になることを確認する
    # 目的: 必須項目の未入力を拒否する
    place = build_place(tabelog_url: "")
    expect(place).not_to be_valid
    expect(place.errors[:tabelog_url]).to include("can't be blank")
  end

  it "requires visit_status" do
    # 概要: 来店ステータスが空のときに無効になることを確認する
    # 目的: 必須項目の未入力を拒否する
    place = build_place(visit_status: "")
    expect(place).not_to be_valid
    expect(place.errors[:visit_status]).to include("can't be blank")
  end

  it "rejects non tabelog domain" do
    # 概要: tabelog.com 以外のURLが無効になることを確認する
    # 目的: ドメイン制約が機能することを担保する
    place = build_place(tabelog_url: "https://example.com/shop")
    expect(place).not_to be_valid
    expect(place.errors[:tabelog_url]).to include("はtabelog.com ドメインのURLを入力してください")
  end

  it "rejects non http url" do
    # 概要: http/https 以外のURLが無効になることを確認する
    # 目的: URL形式の最低限の妥当性を担保する
    place = build_place(tabelog_url: "tabelog.com/tokyo/A0000001")
    expect(place).not_to be_valid
    expect(place.errors[:tabelog_url]).to include("はhttps://tabelog.com のURLを入力してください")
  end

  it "normalizes tabelog url" do
    # 概要: URLの正規化が行われることを確認する
    # 目的: トリム・スキーム統一・クエリ削除・末尾スラッシュ除去を担保する
    place = build_place(tabelog_url: "  http://TaBeLoG.com/tokyo/A0000001/?foo=1  ")
    place.valid?
    expect(place.tabelog_url).to eq("https://tabelog.com/tokyo/A0000001")
  end

  it "detects duplicates after normalization" do
    # 概要: 正規化後のURLで重複判定されることを確認する
    # 目的: 同一URLの重複登録を防止する
    described_class.create!(
      name: "既存",
      tabelog_url: "http://tabelog.com/tokyo/A0000002/?utm=1",
      visit_status: "visited"
    )

    duplicate = build_place(tabelog_url: "https://tabelog.com/tokyo/A0000002")
    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:tabelog_url]).to include("has already been taken")
  end

  it "accepts allowed revisit_intent values" do
    # 概要: 再訪意向の許容値が有効になることを確認する
    # 目的: 許容値以外を弾くための前提を担保する
    %w[yes no unknown].each do |value|
      place = build_place(revisit_intent: value)
      expect(place).to be_valid, "expected #{value} to be valid"
    end
  end

  it "rejects invalid revisit_intent" do
    # 概要: 再訪意向の許容値以外が無効になることを確認する
    # 目的: 不正な値の登録を防止する
    place = build_place(revisit_intent: "maybe")
    expect(place).not_to be_valid
    expect(place.errors[:revisit_intent]).to include("is not included in the list")
  end

  it "normalizes blank revisit_intent to nil" do
    # 概要: 空の再訪意向がnilに正規化されることを確認する
    # 目的: 空文字による不正な保存を防ぐ
    place = build_place(revisit_intent: " ")
    place.valid?
    expect(place.revisit_intent).to be_nil
    expect(place).to be_valid
  end
end
