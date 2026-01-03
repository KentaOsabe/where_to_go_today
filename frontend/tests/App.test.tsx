import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import type { Place } from '../src/types/place'

const mockPlace: Place = {
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

beforeEach(() => {
  window.history.pushState(null, '', '/')
})

afterEach(() => {
  vi.restoreAllMocks()
  window.history.pushState(null, '', '/')
})

describe('App', () => {
  it('必須項目の未入力を検知してエラーを表示する', async () => {
    // 概要: 必須項目が空のまま送信した場合にエラーを表示する
    // 目的: 未入力のまま送信できないことを保証する
    render(<App />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(screen.getByText('店名を入力してください')).toBeInTheDocument()
    expect(screen.getByText('食べログURLを入力してください')).toBeInTheDocument()
  })

  it('tabelog.com 以外のURLを拒否して理由を表示する', async () => {
    // 概要: tabelog.com 以外のURLを入力した場合にエラーを表示する
    // 目的: ドメイン制約がフロントでも機能することを確認する
    render(<App />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('店名'), 'テスト店')
    await user.type(
      screen.getByLabelText(/食べログURL/),
      'https://example.com'
    )
    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(screen.queryByText('店名を入力してください')).not.toBeInTheDocument()
    expect(
      screen.getByText('tabelog.com ドメインのURLを入力してください')
    ).toBeInTheDocument()
  })

  it('詳細ルートでは登録結果のみを表示する', async () => {
    // 概要: /places/:id 直アクセス時に詳細表示専用の画面になることを確認する
    // 目的: 登録結果の確認ビューがフォームと分離されていることを保証する
    window.history.pushState(null, '', '/places/1')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlace),
    } as unknown as Response)

    render(<App />)

    expect(
      screen.queryByText('今日の候補を、最小入力で。')
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText('店名')).not.toBeInTheDocument()

    expect(await screen.findByText('登録結果')).toBeInTheDocument()
    expect(await screen.findByText('テスト店')).toBeInTheDocument()
  })
})
