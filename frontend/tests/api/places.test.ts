import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPlace,
  deletePlace,
  fetchPlace,
  fetchPlaces,
  updatePlace,
} from '../../src/api/places'
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

  it('更新成功時にplaceを返す', async () => {
    // 概要: 更新APIが成功した場合に成功結果を返す
    // 目的: 編集後の内容をUI側で正しく扱えるようにする
    const place: Place = {
      id: 2,
      name: '更新後の店',
      tabelog_url: 'https://tabelog.com/tokyo/1111',
      visit_status: 'visited',
      genre: null,
      area: null,
      price_range: null,
      note: null,
      created_at: '2026-01-03T00:00:00Z',
      updated_at: '2026-01-04T00:00:00Z',
    }

    mockFetch(place, { ok: true, status: 200 })

    const result = await updatePlace(2, formState)

    expect(result.type).toBe('success')
    if (result.type === 'success') {
      expect(result.place).toEqual(place)
    }
  })

  it('更新時の重複エラーをduplicateとして返す', async () => {
    // 概要: 更新でURL重複(409)が発生した場合の結果を確認する
    // 目的: 重複時に既存データへの導線を提示できるようにする
    mockFetch(
      {
        errors: { tabelog_url: ['すでに登録されています'] },
        existing_place_id: 5,
      },
      { ok: false, status: 409 }
    )

    const result = await updatePlace(2, formState)

    expect(result.type).toBe('duplicate')
    if (result.type === 'duplicate') {
      expect(result.existingPlaceId).toBe(5)
      expect(result.errors?.errors?.tabelog_url?.[0]).toBe(
        'すでに登録されています'
      )
    }
  })

  it('更新時のバリデーションエラーをvalidationとして返す', async () => {
    // 概要: 更新でバリデーションエラー(422)が発生した場合の結果を確認する
    // 目的: 入力エラーの理由を画面に表示できるようにする
    mockFetch(
      {
        errors: { name: ['店名を入力してください'] },
      },
      { ok: false, status: 422 }
    )

    const result = await updatePlace(2, formState)

    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.errors?.errors?.name?.[0]).toBe('店名を入力してください')
    }
  })

  it('更新対象が存在しない場合はnot_foundとして返す', async () => {
    // 概要: 更新対象が見つからない(404)場合の結果を確認する
    // 目的: 画面側で存在しない旨のメッセージを表示できるようにする
    mockFetch({ message: 'not found' }, { ok: false, status: 404 })

    const result = await updatePlace(2, formState)

    expect(result.type).toBe('not_found')
  })

  it('更新時に想定外のエラーはfailureとして返す', async () => {
    // 概要: 更新APIが想定外のエラーを返した場合の結果を確認する
    // 目的: 汎用エラーとして扱えるようにする
    mockFetch({ message: 'error' }, { ok: false, status: 500 })

    const result = await updatePlace(2, formState)

    expect(result.type).toBe('failure')
  })

  it('削除成功時にsuccessを返す', async () => {
    // 概要: 削除APIが成功した場合に成功結果を返す
    // 目的: 削除後の遷移を正しく行えるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const result = await deletePlace(2)

    expect(result.type).toBe('success')
  })

  it('削除対象が存在しない場合はnot_foundとして返す', async () => {
    // 概要: 削除対象が見つからない(404)場合の結果を確認する
    // 目的: 画面側で対象なしの表示を行えるようにする
    mockFetch({ message: 'not found' }, { ok: false, status: 404 })

    const result = await deletePlace(2)

    expect(result.type).toBe('not_found')
  })

  it('削除時に想定外のエラーはfailureとして返す', async () => {
    // 概要: 削除APIが想定外のエラーを返した場合の結果を確認する
    // 目的: 汎用エラーとして扱えるようにする
    mockFetch({ message: 'error' }, { ok: false, status: 500 })

    const result = await deletePlace(2)

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

    await expect(fetchPlaces({ page: 1, per: 20 })).rejects.toThrow(
      'Failed to load places'
    )
  })
})
