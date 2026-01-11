import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PlaceDetailScreen } from '../src/screens/PlaceDetailScreen'
import type { Place } from '../src/types/place'

const basePlace: Place = {
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

const renderScreen = (initialPath = '/places/1') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/places/:id" element={<PlaceDetailScreen />} />
        <Route path="/places/:id/edit" element={<div>edit</div>} />
        <Route path="/places" element={<div>list</div>} />
      </Routes>
    </MemoryRouter>
  )

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('PlaceDetailScreen', () => {
  it('不正なIDの場合にエラーメッセージを表示する', async () => {
    // 概要: IDが不正な場合にエラーメッセージが表示されることを確認する
    // 目的: 存在しないIDへのアクセス時に適切な案内を出せるようにする
    renderScreen('/places/abc')

    expect(
      await screen.findByText('指定されたデータが見つかりませんでした。')
    ).toBeInTheDocument()
  })

  it('取得成功時に詳細情報とアクションを表示する', async () => {
    // 概要: 詳細取得が成功した場合に内容とアクションが表示されることを確認する
    // 目的: 詳細画面で店舗情報と操作導線を提供できるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(basePlace),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()

    expect(await screen.findByText('テスト店')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument()
  })

  it('店舗一覧へのリンクを表示する', async () => {
    // 概要: 詳細画面に店舗一覧へのリンクが表示されることを確認する
    // 目的: 詳細画面から一覧へ戻れる導線を用意する
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(basePlace),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()

    const listLink = await screen.findByRole('link', { name: '店舗一覧へ' })
    expect(listLink).toHaveAttribute('href', '/places')
  })

  it('取得失敗時にエラーメッセージを表示する', async () => {
    // 概要: 詳細取得が失敗した場合にエラーメッセージが表示されることを確認する
    // 目的: 取得失敗時に再試行判断ができるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()

    expect(
      await screen.findByText(
        '店舗詳細を取得できませんでした。時間をおいて再度お試しください。'
      )
    ).toBeInTheDocument()
  })

  it('編集ボタンで編集画面へ遷移する', async () => {
    // 概要: 編集ボタン押下で編集画面へ遷移することを確認する
    // 目的: 詳細画面から編集画面へ移動できるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(basePlace),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()
    const user = userEvent.setup()

    await screen.findByText('テスト店')
    await user.click(screen.getByRole('button', { name: '編集' }))

    expect(await screen.findByText('edit')).toBeInTheDocument()
  })

  it('削除確認後に削除成功で一覧へ遷移する', async () => {
    // 概要: 削除確認後に削除成功で一覧へ遷移することを確認する
    // 目的: 削除後に一覧で状態を確認できるようにする
    const fetchMock = vi.fn().mockImplementation((input, options) => {
      const method = (options as RequestInit | undefined)?.method ?? 'GET'
      const url = typeof input === 'string' ? input : input.url
      if (method === 'GET' && url === '/api/places/1') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(basePlace),
        } as unknown as Response)
      }
      if (method === 'DELETE' && url === '/api/places/1') {
        return Promise.resolve({
          ok: true,
          status: 204,
        } as unknown as Response)
      }
      return Promise.reject(new Error('Unexpected fetch'))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()
    const user = userEvent.setup()

    await screen.findByText('テスト店')
    await user.click(screen.getByRole('button', { name: '削除' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '削除する' }))

    await waitFor(() => {
      expect(screen.getByText('list')).toBeInTheDocument()
    })
  })
})
