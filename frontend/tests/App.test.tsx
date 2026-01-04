import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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

const renderApp = (initialPath = '/register') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  )

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('必須項目の未入力を検知してエラーを表示する', async () => {
    // 概要: 必須項目が空のまま送信した場合にエラーを表示する
    // 目的: 未入力のまま送信できないことを保証する
    renderApp()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(screen.getByText('店名を入力してください')).toBeInTheDocument()
    expect(screen.getByText('食べログURLを入力してください')).toBeInTheDocument()
  })

  it('tabelog.com 以外のURLを拒否して理由を表示する', async () => {
    // 概要: tabelog.com 以外のURLを入力した場合にエラーを表示する
    // 目的: ドメイン制約がフロントでも機能することを確認する
    renderApp()
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

  it('必須項目のみで登録でき、結果が表示される', async () => {
    // 概要: 必須項目のみ入力した場合に登録が成功し結果が表示されることを確認する
    // 目的: 最小入力でも登録と確認が完了できることを保証する
    const fetchMock = vi.fn().mockImplementation((input) => {
      if (typeof input === 'string' && input.startsWith('/api/places/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            id: 10,
            name: 'テスト店',
            tabelog_url: 'https://tabelog.com/tokyo/0000',
            visit_status: 'not_visited',
            genre: null,
            area: null,
            price_range: null,
            note: null,
            created_at: '2026-01-03T00:00:00Z',
            updated_at: '2026-01-03T00:00:00Z',
          }),
        } as unknown as Response)
      }

      return Promise.resolve({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({
          id: 10,
          name: 'テスト店',
          tabelog_url: 'https://tabelog.com/tokyo/0000',
          visit_status: 'not_visited',
          genre: null,
          area: null,
          price_range: null,
          note: null,
          created_at: '2026-01-03T00:00:00Z',
          updated_at: '2026-01-03T00:00:00Z',
        }),
      } as unknown as Response)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderApp()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('店名'), 'テスト店')
    await user.type(
      screen.getByLabelText(/食べログURL/),
      'https://tabelog.com/tokyo/0000'
    )
    await user.click(screen.getByRole('button', { name: '登録する' }))

    await screen.findByText('登録結果')
    expect(await screen.findByText('テスト店')).toBeInTheDocument()
    expect(await screen.findByText('行っていない')).toBeInTheDocument()
    expect(screen.queryByText('ジャンル')).not.toBeInTheDocument()

    const postCall = fetchMock.mock.calls.find(([, options]) => {
      const method = (options as RequestInit | undefined)?.method
      return method === 'POST'
    })
    expect(postCall).toBeDefined()
    const [, options] = postCall as [RequestInfo, RequestInit]
    const body = JSON.parse(options.body as string)
    expect(body).toMatchObject({
      name: 'テスト店',
      tabelog_url: 'https://tabelog.com/tokyo/0000',
      visit_status: 'not_visited',
      genre: '',
      area: '',
      price_range: '',
      note: '',
    })
  })

  it('詳細ルートでは登録結果のみを表示する', async () => {
    // 概要: /places/:id 直アクセス時に詳細表示専用の画面になることを確認する
    // 目的: 登録結果の確認ビューがフォームと分離されていることを保証する
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlace),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderApp('/places/1')

    expect(
      screen.queryByText('今日の候補を、最小入力で。')
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText('店名')).not.toBeInTheDocument()

    expect(await screen.findByText('登録結果')).toBeInTheDocument()
    expect(await screen.findByText('テスト店')).toBeInTheDocument()
  })

  it('詳細から戻るとエラー表示がリセットされる', async () => {
    // 概要: 詳細表示からフォームに戻った際にエラー表示が残らないことを確認する
    // 目的: 新規登録開始時に不要なエラーが表示されないことを保証する
    const fetchMock = vi.fn().mockImplementation((input) => {
      if (typeof input === 'string' && input.startsWith('/api/places/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(mockPlace),
        } as unknown as Response)
      }
      return Promise.resolve({
        ok: false,
        status: 409,
        json: vi
          .fn()
          .mockResolvedValue({
            errors: { tabelog_url: ['すでに登録されています'] },
            existing_place_id: 1,
          }),
      } as unknown as Response)
    })
    vi.stubGlobal('fetch', fetchMock)

    renderApp()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('店名'), 'テスト店')
    await user.type(
      screen.getByLabelText(/食べログURL/),
      'https://tabelog.com/tokyo/0000'
    )
    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(screen.getByText('すでに登録されたURLです。')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: '登録済みデータを確認する' })
    )

    expect(await screen.findByText('登録結果')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: '新しく登録する' })
    )

    await waitFor(() => {
      expect(
        screen.queryByText('すでに登録されたURLです。')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('このURLはすでに登録されています。')
      ).not.toBeInTheDocument()
    })
  })
})
