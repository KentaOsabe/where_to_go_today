import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlaceResult } from '../../src/components/PlaceResult'
import type { Place } from '../../src/types/place'

describe('PlaceResult', () => {
  it('登録結果を表示する', () => {
    // 概要: 登録済みの店舗情報が表示されることを確認する
    // 目的: 登録後の詳細確認ができることを保証する
    const place: Place = {
      id: 1,
      name: 'テスト店',
      tabelog_url: 'https://tabelog.com/tokyo/0000',
      visit_status: 'visited',
      genre: '和食',
      area: '渋谷',
      price_range: '3000-5000',
      note: 'メモ',
      created_at: '2026-01-03T00:00:00Z',
      updated_at: '2026-01-03T00:00:00Z',
    }

    render(
      <PlaceResult
        activePlace={place}
        isLoading={false}
        error={null}
        onBackToForm={() => undefined}
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
        onBackToForm={() => undefined}
      />
    )

    expect(screen.getByText('取得に失敗しました')).toBeInTheDocument()
  })
})
