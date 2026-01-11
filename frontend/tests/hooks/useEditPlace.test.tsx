import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEditPlace } from '../../src/hooks/useEditPlace'
import type { Place } from '../../src/types/place'

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

const basePlace: Place = {
  id: 7,
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

const EditHarness = ({
  placeId,
  onSuccess,
}: {
  placeId: number | null
  onSuccess: (place: Place) => void
}) => {
  const { formState, isLoading, loadError } = useEditPlace({
    placeId,
    onSuccess,
  })

  return (
    <div>
      <div data-testid="form-state">{JSON.stringify(formState)}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
      <div data-testid="load-error">{loadError ?? ''}</div>
    </div>
  )
}

const EditSubmitHarness = ({
  placeId,
  onSuccess,
}: {
  placeId: number | null
  onSuccess: (place: Place) => void
}) => {
  const { formState, isReady, handleChange, handleSubmit } = useEditPlace({
    placeId,
    onSuccess,
  })

  if (!isReady) {
    return <div>loading</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        aria-label="店名"
        value={formState.name}
        onChange={handleChange}
      />
      <input
        name="tabelog_url"
        aria-label="食べログURL"
        value={formState.tabelog_url}
        onChange={handleChange}
      />
      <select
        name="visit_status"
        aria-label="来店ステータス"
        value={formState.visit_status}
        onChange={handleChange}
      >
        <option value="not_visited">行っていない</option>
        <option value="visited">行った</option>
      </select>
      <input
        name="visit_reason"
        aria-label="行った理由"
        value={formState.visit_reason}
        onChange={handleChange}
      />
      <button type="submit">送信</button>
    </form>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useEditPlace', () => {
  it('取得した値をフォーム初期値として保持する', async () => {
    // 概要: 取得した詳細がフォームに反映されることを確認する
    // 目的: 編集画面で既存値を初期表示できることを保証する
    mockFetch(basePlace, { ok: true, status: 200 })

    render(<EditHarness placeId={basePlace.id} onSuccess={vi.fn()} />)

    await waitFor(() => {
      const payload = JSON.parse(
        screen.getByTestId('form-state').textContent ?? '{}'
      ) as Record<string, string>
      expect(payload.name).toBe('テスト店')
      expect(payload.genre).toBe('')
      expect(payload.note).toBe('')
    })

    expect(screen.getByTestId('load-error')).toHaveTextContent('')
  })

  it('更新成功時にonSuccessを呼び出す', async () => {
    // 概要: 更新が成功したときにコールバックが呼ばれることを確認する
    // 目的: 更新完了後に詳細画面へ遷移できるようにする
    const updatedPlace: Place = {
      ...basePlace,
      name: '更新後の店',
      visit_status: 'visited',
      updated_at: '2026-01-04T00:00:00Z',
    }

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(basePlace),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(updatedPlace),
      } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(<EditSubmitHarness placeId={basePlace.id} onSuccess={onSuccess} />)

    await screen.findByLabelText('店名')
    await user.click(screen.getByRole('button', { name: '送信' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(updatedPlace)
    })
  })

  it('更新ペイロードに行った理由を含める', async () => {
    // 概要: 更新リクエストに行った理由が含まれることを確認する
    // 目的: 追加情報がAPIに送信されることを保証する
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(basePlace),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(basePlace),
      } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(<EditSubmitHarness placeId={basePlace.id} onSuccess={vi.fn()} />)

    await screen.findByLabelText('店名')
    await user.type(screen.getByLabelText('行った理由'), '再訪したい理由')
    await user.click(screen.getByRole('button', { name: '送信' }))

    const [, options] = fetchMock.mock.calls[1]
    const body = JSON.parse((options as RequestInit).body as string)
    expect(body.visit_reason).toBe('再訪したい理由')
  })
})
