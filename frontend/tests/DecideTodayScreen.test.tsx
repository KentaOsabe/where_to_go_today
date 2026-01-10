import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DecideTodayScreen } from '../src/screens/DecideTodayScreen'
import type {
  Recommendation,
  RecommendationConditions,
} from '../src/types/place'

const buildRecommendation = (id: number, name = 'テスト店'): Recommendation => ({
  place: {
    id,
    name,
    tabelog_url: 'https://tabelog.com/tokyo/0000',
    visit_status: 'not_visited',
    genre: '和食',
    area: '渋谷',
    price_range: '3000-5000',
    note: null,
    visit_reason: null,
    revisit_intent: null,
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
  reason: '条件に近い: ジャンル: 和食 / エリア: 渋谷',
})

const renderScreen = () =>
  render(
    <MemoryRouter>
      <DecideTodayScreen />
    </MemoryRouter>
  )

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DecideTodayScreen', () => {
  const conditions: RecommendationConditions = {
    genre: '和食',
    area: '渋谷',
    price_range: '3000-5000',
  }

  it('条件入力後に提案結果と理由を表示する', async () => {
    // 概要: 条件入力後に提案結果が表示されることを確認する
    // 目的: 提案結果と理由を画面で確認できるようにする
    const recommendations = [buildRecommendation(1)]
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ conditions, recommendations }),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('ジャンル'), conditions.genre ?? '')
    await user.type(screen.getByLabelText('エリア'), conditions.area ?? '')
    await user.type(
      screen.getByLabelText('予算帯'),
      conditions.price_range ?? ''
    )
    await user.click(screen.getByRole('button', { name: '提案する' }))

    expect(await screen.findByText('テスト店')).toBeInTheDocument()
    expect(
      screen.getByText('条件に近い: ジャンル: 和食 / エリア: 渋谷')
    ).toBeInTheDocument()
    expect(screen.getByText('現在 1 件を提案しています。')).toBeInTheDocument()
  })

  it('提案実行中はローディングを表示する', async () => {
    // 概要: 提案実行中にローディングが表示されることを確認する
    // 目的: 実行中であることをユーザーに伝えられるようにする
    const pendingPromise = new Promise<Response>(() => {})
    vi.stubGlobal('fetch', vi.fn(() => pendingPromise))

    renderScreen()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '提案する' }))

    expect(
      await screen.findByText('提案を作成中です。')
    ).toBeInTheDocument()
  })

  it('失敗時にエラーと再試行導線を表示する', async () => {
    // 概要: 提案取得が失敗した場合にエラーと再試行を表示する
    // 目的: 失敗時でも再試行できるようにする
    const recommendations = [buildRecommendation(2, '再試行店')]
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'error' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ conditions, recommendations }),
      } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '提案する' }))

    expect(
      await screen.findByText('提案に失敗しました。再試行してください。')
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '再試行する' }))

    expect(await screen.findByText('再試行店')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('0件の場合に条件変更の案内を表示する', async () => {
    // 概要: 提案結果が0件の場合に案内が表示されることを確認する
    // 目的: 条件変更の必要性をユーザーに伝えられるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ conditions, recommendations: [] }),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '提案する' }))

    expect(
      await screen.findByText('条件を変えて試してください。')
    ).toBeInTheDocument()
  })
})
