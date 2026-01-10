import { afterEach, describe, expect, it, vi } from 'vitest'
import { recommendPlaces } from '../../src/api/recommendations'
import type {
  Recommendation,
  RecommendationConditions,
} from '../../src/types/place'

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
  return fetchMock
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('api/recommendations', () => {
  const conditions: RecommendationConditions = {
    genre: '和食',
    area: '渋谷',
    price_range: '3000-5000',
  }

  it('成功時に条件と提案一覧を返す', async () => {
    // 概要: 提案APIが成功した場合に結果を返すことを確認する
    // 目的: 画面側で提案結果を扱えるようにする
    const recommendations: Recommendation[] = [
      {
        place: {
          id: 1,
          name: 'テスト店',
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
      },
    ]
    const fetchMock = mockFetch(
      { conditions, recommendations },
      { ok: true, status: 200 }
    )

    const result = await recommendPlaces(conditions)

    expect(result.type).toBe('success')
    if (result.type === 'success') {
      expect(result.conditions).toEqual(conditions)
      expect(result.recommendations).toEqual(recommendations)
    }
    expect(fetchMock).toHaveBeenCalledWith('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conditions),
    })
  })

  it('失敗時にfailureを返す', async () => {
    // 概要: 提案APIが失敗した場合にfailureを返すことを確認する
    // 目的: 失敗時に再試行導線を表示できるようにする
    mockFetch({ message: 'error' }, { ok: false, status: 500 })

    const result = await recommendPlaces(conditions)

    expect(result.type).toBe('failure')
  })

  it('JSON解析に失敗した場合はfailureを返す', async () => {
    // 概要: JSON解析が失敗した場合にfailureを返すことを確認する
    // 目的: 不正なレスポンスを安全に扱えるようにする
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new Error('parse error')),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const result = await recommendPlaces(conditions)

    expect(result.type).toBe('failure')
  })
})
