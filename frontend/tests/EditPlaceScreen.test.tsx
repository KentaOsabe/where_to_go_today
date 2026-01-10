import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { EditPlaceScreen } from '../src/screens/EditPlaceScreen'
import type { Place } from '../src/types/place'

const basePlace: Place = {
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
}

const DetailFallback = () => {
  const { id } = useParams()
  return <div>detail:{id}</div>
}

const renderScreen = (initialPath = '/places/1/edit') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/places/:id/edit" element={<EditPlaceScreen />} />
        <Route path="/places/:id" element={<DetailFallback />} />
        <Route path="/places" element={<div>list</div>} />
      </Routes>
    </MemoryRouter>
  )

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('EditPlaceScreen', () => {
  it('初期値として既存データを表示する', async () => {
    // 概要: 取得した店舗情報がフォーム初期値に反映されることを確認する
    // 目的: 編集画面で既存値を確認して更新できるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(basePlace),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()

    expect(await screen.findByLabelText('店名')).toHaveValue('テスト店')
    expect(screen.getByLabelText(/食べログURL/)).toHaveValue(
      'https://tabelog.com/tokyo/0000'
    )
    expect(screen.getByLabelText('ジャンル')).toHaveValue('')
    expect(screen.getByLabelText('メモ')).toHaveValue('')
  })

  it('更新時のバリデーションエラーを表示する', async () => {
    // 概要: 更新APIが422を返した場合にエラー表示されることを確認する
    // 目的: 入力内容の不備をユーザーに伝えられるようにする
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
      if (method === 'PATCH' && url === '/api/places/1') {
        return Promise.resolve({
          ok: false,
          status: 422,
          json: vi.fn().mockResolvedValue({
            errors: { name: ["can't be blank"] },
          }),
        } as unknown as Response)
      }
      return Promise.reject(new Error('Unexpected fetch'))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()
    const user = userEvent.setup()

    await screen.findByLabelText('店名')
    await user.click(screen.getByRole('button', { name: '更新する' }))

    expect(await screen.findByText('入力内容を確認してください。')).toBeInTheDocument()
    expect(screen.getByText("can't be blank")).toBeInTheDocument()
  })

  it('重複エラー時に既存詳細への導線を表示する', async () => {
    // 概要: URL重複時に案内と導線が表示されることを確認する
    // 目的: 既存データを確認できるようにする
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
      if (method === 'PATCH' && url === '/api/places/1') {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: vi.fn().mockResolvedValue({
            errors: { tabelog_url: ['すでに登録されています'] },
            existing_place_id: 5,
          }),
        } as unknown as Response)
      }
      return Promise.reject(new Error('Unexpected fetch'))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()
    const user = userEvent.setup()

    await screen.findByLabelText('店名')
    await user.click(screen.getByRole('button', { name: '更新する' }))

    expect(await screen.findByText('このURLはすでに登録されています。')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: '登録済みデータを確認する' })
    )

    expect(await screen.findByText('detail:5')).toBeInTheDocument()
  })

  it('更新成功時に詳細画面へ遷移する', async () => {
    // 概要: 更新が成功した場合に詳細画面へ遷移することを確認する
    // 目的: 更新後の内容をすぐ確認できるようにする
    const updatedPlace: Place = {
      ...basePlace,
      name: '更新後の店',
      updated_at: '2026-01-04T00:00:00Z',
    }
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
      if (method === 'PATCH' && url === '/api/places/1') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue(updatedPlace),
        } as unknown as Response)
      }
      return Promise.reject(new Error('Unexpected fetch'))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()
    const user = userEvent.setup()

    await screen.findByLabelText('店名')
    await user.click(screen.getByRole('button', { name: '更新する' }))

    expect(await screen.findByText('detail:1')).toBeInTheDocument()
  })

  it('取得失敗時にエラーメッセージを表示する', async () => {
    // 概要: 編集対象の取得に失敗した場合にエラーメッセージを表示する
    // 目的: 取得失敗時でもユーザーに原因を伝えられるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderScreen()

    expect(
      await screen.findByText(
        '編集対象を取得できませんでした。時間をおいて再度お試しください。'
      )
    ).toBeInTheDocument()
  })
})
