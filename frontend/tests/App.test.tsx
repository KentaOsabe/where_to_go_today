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
  visit_reason: null,
  revisit_intent: null,
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

  it('必須項目のみで登録でき、一覧へ遷移する', async () => {
    // 概要: 必須項目のみ入力した場合に登録が成功し一覧画面へ遷移する
    // 目的: 登録完了後に一覧で確認できることを保証する
    const fetchMock = vi.fn().mockImplementation((input, options) => {
      const method = (options as RequestInit | undefined)?.method
      if (method === 'POST') {
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
            visit_reason: null,
            revisit_intent: null,
            created_at: '2026-01-03T00:00:00Z',
            updated_at: '2026-01-03T00:00:00Z',
          }),
        } as unknown as Response)
      }

      if (typeof input === 'string' && input.startsWith('/api/places?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            places: [
              {
                id: 10,
                name: 'テスト店',
                tabelog_url: 'https://tabelog.com/tokyo/0000',
                visit_status: 'not_visited',
                genre: null,
                area: null,
                price_range: null,
                note: null,
                visit_reason: null,
                revisit_intent: null,
                created_at: '2026-01-03T00:00:00Z',
                updated_at: '2026-01-03T00:00:00Z',
              },
            ],
            pagination: { page: 1, per: 20, total_count: 1, total_pages: 1 },
          }),
        } as unknown as Response)
      }

      if (typeof input === 'string' && input === '/api/places') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            places: [
              {
                id: 10,
                name: 'テスト店',
                tabelog_url: 'https://tabelog.com/tokyo/0000',
                visit_status: 'not_visited',
                genre: null,
                area: null,
                price_range: null,
                note: null,
                visit_reason: null,
                revisit_intent: null,
                created_at: '2026-01-03T00:00:00Z',
                updated_at: '2026-01-03T00:00:00Z',
              },
            ],
            pagination: { page: 1, per: 20, total_count: 1, total_pages: 1 },
          }),
        } as unknown as Response)
      }
      return Promise.reject(new Error('Unexpected fetch'))
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

    expect(
      await screen.findByText('登録済みのお店')
    ).toBeInTheDocument()
    expect(await screen.findByText('テスト店')).toBeInTheDocument()
    expect(await screen.findByText('行っていない')).toBeInTheDocument()
    expect(screen.queryByText('店舗詳細')).not.toBeInTheDocument()

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

  it('詳細ルートでは店舗詳細のみを表示する', async () => {
    // 概要: /places/:id 直アクセス時に詳細表示専用の画面になることを確認する
    // 目的: 店舗詳細ビューがフォームと分離されていることを保証する
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

    expect(await screen.findByText('店舗詳細')).toBeInTheDocument()
    expect(await screen.findByText('テスト店')).toBeInTheDocument()
  })

  it('詳細画面に編集/削除アクションを表示する', async () => {
    // 概要: 詳細画面で編集・削除ボタンが表示されることを確認する
    // 目的: 詳細画面の操作導線が提供されることを保証する
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPlace),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderApp('/places/1')

    expect(await screen.findByRole('button', { name: '編集' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument()
  })

  it('削除確認ダイアログで再試行できる', async () => {
    // 概要: 削除確認後に失敗した場合でも再試行できることを確認する
    // 目的: 削除失敗時にユーザーがやり直せる導線を提供できるようにする
    let deleteCallCount = 0
    const fetchMock = vi.fn().mockImplementation((input, options) => {
      const method = (options as RequestInit | undefined)?.method ?? 'GET'
      const url = typeof input === 'string' ? input : input.url

      if (method === 'GET' && url === '/api/places/1') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(mockPlace),
        } as unknown as Response)
      }

      if (method === 'DELETE' && url === '/api/places/1') {
        deleteCallCount += 1
        if (deleteCallCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: vi.fn().mockResolvedValue({}),
          } as unknown as Response)
        }
        return Promise.resolve({
          ok: true,
          status: 204,
        } as unknown as Response)
      }

      if (method === 'GET' && url.startsWith('/api/places')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            places: [],
            pagination: { page: 1, per: 20, total_count: 0, total_pages: 0 },
          }),
        } as unknown as Response)
      }

      return Promise.reject(new Error('Unexpected fetch'))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderApp('/places/1')
    const user = userEvent.setup()

    await screen.findByText('店舗詳細')
    await user.click(screen.getByRole('button', { name: '削除' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '削除する' }))

    expect(
      await screen.findByText(
        '削除に失敗しました。時間をおいて再度お試しください。'
      )
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '再試行する' }))

    expect(await screen.findByText('登録済みのお店')).toBeInTheDocument()
    expect(deleteCallCount).toBe(2)
  })

  it('一覧画面上部の登録ボタンから登録フォームへ遷移できる', async () => {
    // 概要: 一覧画面の上部にある登録ボタンから登録フォームへ移動できる
    // 目的: 一覧画面の登録導線が機能することを保証する
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        places: [
          {
            id: 1,
            name: 'テスト店',
            tabelog_url: 'https://tabelog.com/tokyo/0000',
            visit_status: 'not_visited',
            genre: null,
            area: null,
            price_range: null,
            note: null,
            visit_reason: null,
            revisit_intent: null,
            created_at: '2026-01-03T00:00:00Z',
            updated_at: '2026-01-03T00:00:00Z',
          },
        ],
        pagination: { page: 1, per: 20, total_count: 1, total_pages: 1 },
      }),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderApp('/places')
    const user = userEvent.setup()

    const registerLink = await screen.findByRole('link', {
      name: 'お店を登録する',
    })
    await user.click(registerLink)

    expect(
      await screen.findByText('今日の候補を、最小入力で。')
    ).toBeInTheDocument()
  })

  it('ページングの次へボタンでクエリと同期して再取得できる', async () => {
    // 概要: 一覧画面で次へボタンを押すとページングの取得が行われる
    // 目的: ?page= クエリと同期したページングが機能することを保証する
    const buildResponse = (page: number, totalPages = 3) => ({
      places: [mockPlace],
      pagination: {
        page,
        per: 20,
        total_count: 3,
        total_pages: totalPages,
      },
    })
    const fetchMock = vi.fn().mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input.url
      if (url.startsWith('/api/places')) {
        const match = url.match(/page=(\d+)/)
        const page = match ? Number(match[1]) : 1
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue(buildResponse(page)),
        } as unknown as Response)
      }
      return Promise.reject(new Error('Unexpected fetch'))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderApp('/places?page=2')
    const user = userEvent.setup()

    const nextButton = await screen.findByRole('button', { name: '次へ' })
    expect(screen.getByRole('button', { name: '前へ' })).toBeEnabled()
    expect(nextButton).toBeEnabled()

    await user.click(nextButton)

    await waitFor(() => {
      const hasPage3 = fetchMock.mock.calls.some(
        ([url]) => url === '/api/places?page=3'
      )
      expect(hasPage3).toBe(true)
    })
  })

  it('ページ端では前へ/次へボタンが無効になる', async () => {
    // 概要: ページングの最初と最後では前後ボタンが無効になる
    // 目的: 範囲外への移動ができないことを保証する
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        places: [mockPlace],
        pagination: { page: 1, per: 20, total_count: 2, total_pages: 1 },
      }),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderApp('/places?page=1')

    const prevButton = await screen.findByRole('button', { name: '前へ' })
    const nextButton = screen.getByRole('button', { name: '次へ' })

    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  it('総件数がある場合は空状態を表示せずページングを維持する', async () => {
    // 概要: 総件数が存在している場合は空配列でも空状態扱いにしない
    // 目的: 範囲外ページでも戻る導線が消えないことを保証する
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        places: [],
        pagination: { page: 5, per: 20, total_count: 10, total_pages: 2 },
      }),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderApp('/places?page=5')

    expect(
      await screen.findByText('現在 10 件のお店があります。')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('まだ登録がありません。')
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '前へ' })).toBeEnabled()
  })
})
