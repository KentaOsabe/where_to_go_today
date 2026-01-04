import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPlace, fetchPlace, fetchPlaces } from '../../src/api/places'
import type { FormState, Place } from '../../src/types/place'

const mockFetch = (
  payload: unknown,
  options: { ok?: boolean; status?: number } = {}
) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response)
  vi.stubGlobal('fetch', fetchMock)
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('api/places', () => {
  const formState: FormState = {
    name: 'テスト店',
    tabelog_url: 'https://tabelog.com/tokyo/0000',
    visit_status: 'not_visited',
    genre: '',
    area: '',
    price_range: '',
    note: '',
  }

  it('登録成功時にplaceを返す', async () => {
    // 概要: 登録APIが成功した場合に成功結果を返す
    // 目的: フロント側で成功レスポンスを正しく扱えるようにする
    const place: Place = {
      id: 1,
      name: 'テスト店',
      tabelog_url: 'https://tabelog.com/tokyo/0000',
      visit_status: 'not_visited',
      genre: null,
      area: null,
      price_range: null,
      note: null,
      created_at: '2026-01-03T00:00:00Z',
      updated_at: '2026-01-03T00:00:00Z',
    }

    mockFetch(place, { ok: true, status: 201 })

    const result = await createPlace(formState)

    expect(result.type).toBe('success')
    if (result.type === 'success') {
      expect(result.place).toEqual(place)
    }
  })

  it('重複登録時にduplicateとして返す', async () => {
    // 概要: 重複エラー(409)を返した場合の結果を確認する
    // 目的: 既存データへの案内ができるようにエラー情報を保持する
    mockFetch(
      {
        errors: { tabelog_url: ['すでに登録されています'] },
        existing_place_id: 9,
      },
      { ok: false, status: 409 }
    )

    const result = await createPlace(formState)

    expect(result.type).toBe('duplicate')
    if (result.type === 'duplicate') {
      expect(result.existingPlaceId).toBe(9)
      expect(result.errors?.errors?.tabelog_url?.[0]).toBe(
        'すでに登録されています'
      )
    }
  })

  it('バリデーションエラー時にvalidationとして返す', async () => {
    // 概要: バリデーションエラー(422)を返した場合の結果を確認する
    // 目的: 入力エラーの理由を画面に表示できるようにする
    mockFetch(
      {
        errors: { name: ['店名を入力してください'] },
      },
      { ok: false, status: 422 }
    )

    const result = await createPlace(formState)

    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.errors?.errors?.name?.[0]).toBe('店名を入力してください')
    }
  })

  it('その他のエラー時にfailureとして返す', async () => {
    // 概要: 想定外のエラー(500など)を返した場合の結果を確認する
    // 目的: 例外時に汎用エラーとして扱えるようにする
    mockFetch({ message: 'error' }, { ok: false, status: 500 })

    const result = await createPlace(formState)

    expect(result.type).toBe('failure')
  })

  it('詳細取得で失敗した場合に例外を投げる', async () => {
    // 概要: 詳細取得APIが失敗した場合に例外を投げる
    // 目的: 取得失敗時にUI側でエラーを表示できるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPlace(1)).rejects.toThrow('Failed to load place')
  })

  it('一覧取得で成功した場合に一覧とページング情報を返す', async () => {
    // 概要: 一覧取得APIが成功した場合に結果を返す
    // 目的: 取得した一覧とページング情報を画面で扱えるようにする
    const response = {
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
          created_at: '2026-01-03T00:00:00Z',
          updated_at: '2026-01-03T00:00:00Z',
        },
      ],
      pagination: {
        page: 2,
        per: 10,
        total_count: 1,
        total_pages: 1,
      },
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(response),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchPlaces({ page: 2, per: 10 })

    expect(result).toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('/api/places?page=2&per=10')
  })

  it('一覧取得で失敗した場合に例外を投げる', async () => {
    // 概要: 一覧取得APIが失敗した場合に例外を投げる
    // 目的: 取得失敗時にUI側でエラーを表示できるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPlaces({ page: 1, per: 50 })).rejects.toThrow(
      'Failed to load places'
    )
  })
})
