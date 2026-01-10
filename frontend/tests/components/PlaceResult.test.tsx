import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlaceResult } from '../../src/components/PlaceResult'
import type { Place } from '../../src/types/place'

describe('PlaceResult', () => {
  it('店舗詳細を表示する', () => {
    // 概要: 店舗詳細の情報が表示されることを確認する
    // 目的: 詳細画面で登録済み情報を確認できることを保証する
    const place: Place = {
      id: 1,
      name: 'テスト店',
      tabelog_url: 'https://tabelog.com/tokyo/0000',
      visit_status: 'visited',
      genre: '和食',
      area: '渋谷',
      price_range: '3000-5000',
      note: 'メモ',
      visit_reason: null,
      revisit_intent: null,
      created_at: '2026-01-03T00:00:00Z',
      updated_at: '2026-01-03T00:00:00Z',
    }

    render(
      <PlaceResult
        activePlace={place}
        isLoading={false}
        error={null}
        actions={<button type="button">編集</button>}
      />
    )

    expect(screen.getByText('テスト店')).toBeInTheDocument()
    expect(screen.getByText('和食')).toBeInTheDocument()
    expect(screen.getByText('渋谷')).toBeInTheDocument()
  })

  it('エラー時にメッセージを表示する', () => {
    // 概要: 詳細取得エラー時にエラーメッセージを表示する
    // 目的: 取得失敗をユーザーに知らせることを保証する
    render(
      <PlaceResult
        activePlace={null}
        isLoading={false}
        error="取得に失敗しました"
      />
    )

    expect(screen.getByText('取得に失敗しました')).toBeInTheDocument()
  })
})
