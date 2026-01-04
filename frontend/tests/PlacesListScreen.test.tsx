import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PlacesListScreen } from '../src/screens/PlacesListScreen'
import type { Place, PlacesResponse } from '../src/types/place'

const mockPlace: Place = {
  id: 1,
  name: 'テスト店',
  tabelog_url: 'https://tabelog.com/tokyo/0000',
  visit_status: 'visited',
  genre: '和食',
  area: '渋谷',
  price_range: '3000-5000',
  note: 'メモ内容',
  created_at: '2026-01-03T00:00:00Z',
  updated_at: '2026-01-03T00:00:00Z',
}

const buildPlacesResponse = (places: Place[]): PlacesResponse => ({
  places,
  pagination: {
    page: 1,
    per: 20,
    total_count: places.length,
    total_pages: places.length === 0 ? 0 : 1,
  },
})

const renderScreen = () =>
  render(
    <MemoryRouter>
      <PlacesListScreen />
    </MemoryRouter>
  )

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('PlacesListScreen', () => {
  it('一覧取得中にローディング表示を行う', async () => {
    // 概要: 一覧の取得中はローディング文言を表示する
    // 目的: 読み込み中であることがユーザに伝わるようにする
    const pendingPromise = new Promise<Response>(() => {})
    vi.stubGlobal('fetch', vi.fn(() => pendingPromise))

    renderScreen()

    expect(
      await screen.findByText('一覧を読み込み中です。')
    ).toBeInTheDocument()
  })

  it('一覧が空のときに空状態を案内する', async () => {
    // 概要: API が空配列を返した場合に空状態メッセージを表示する
    // 目的: 登録がまだないことと次の行動をユーザに伝える
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(buildPlacesResponse([])),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()

    expect(await screen.findByText('まだ登録がありません。')).toBeInTheDocument()
  })

  it('取得失敗時にエラーと再試行を表示する', async () => {
    // 概要: 取得失敗時にエラーメッセージと再試行ボタンを表示する
    // 目的: 失敗時でもユーザが操作を継続できるようにする
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(buildPlacesResponse([mockPlace])),
      } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()

    expect(
      await screen.findByText(
        '一覧を取得できませんでした。時間をおいて再度お試しください。'
      )
    ).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '再試行する' }))

    expect(await screen.findByText('テスト店')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('一覧アイテムに主要情報を表示する', async () => {
    // 概要: 一覧アイテムに店名リンク/来店ステータス/URL/補足情報を表示する
    // 目的: 一覧で必要な情報を確認できるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(buildPlacesResponse([mockPlace])),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()

    const nameLink = await screen.findByRole('link', { name: 'テスト店' })
    expect(nameLink).toHaveAttribute('href', '/places/1')
    expect(screen.getByText('行った')).toBeInTheDocument()

    const externalLink = screen.getByRole('link', {
      name: 'https://tabelog.com/tokyo/0000',
    })
    expect(externalLink).toHaveAttribute(
      'href',
      'https://tabelog.com/tokyo/0000'
    )

    expect(screen.getByText('ジャンル')).toBeInTheDocument()
    expect(screen.getByText('和食')).toBeInTheDocument()
    expect(screen.getByText('エリア')).toBeInTheDocument()
    expect(screen.getByText('渋谷')).toBeInTheDocument()
    expect(screen.getByText('予算帯')).toBeInTheDocument()
    expect(screen.getByText('3000-5000')).toBeInTheDocument()
    expect(screen.getByText('メモ')).toBeInTheDocument()
    expect(screen.getByText('メモ内容')).toBeInTheDocument()
  })

  it('登録ボタンが/registerへの導線を持つ', async () => {
    // 概要: 一覧画面の登録ボタンが/registerへ遷移できるリンクであることを確認する
    // 目的: 登録導線が常に利用できるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(buildPlacesResponse([])),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()

    const registerLinks = await screen.findAllByRole('link', {
      name: 'お店を登録する',
    })
    registerLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register')
    })
  })
})
