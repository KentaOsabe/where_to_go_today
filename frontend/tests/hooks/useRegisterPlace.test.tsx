import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRegisterPlace } from '../../src/hooks/useRegisterPlace'
import type { Place } from '../../src/types/place'

const mockFetch = (payload: unknown, options: { ok?: boolean; status?: number } = {}) => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response)
}

const RegisterHarness = ({ onSuccess }: { onSuccess: (place: Place) => void }) => {
  const {
    formState,
    errors,
    submitError,
    duplicatePlaceId,
    handleChange,
    handleSubmit,
  } = useRegisterPlace({ onSuccess })

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
      <button type="submit">送信</button>
      <div data-testid="name-error">{errors.name ?? ''}</div>
      <div data-testid="submit-error">{submitError ?? ''}</div>
      <div data-testid="duplicate-id">{duplicatePlaceId ?? ''}</div>
    </form>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useRegisterPlace', () => {
  it('登録成功時にonSuccessを呼び出す', async () => {
    // 概要: 登録が成功したときにコールバックが呼ばれることを確認する
    // 目的: 登録成功後の遷移処理が実行できることを保証する
    const place: Place = {
      id: 12,
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

    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(<RegisterHarness onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('店名'), 'テスト店')
    await user.type(
      screen.getByLabelText('食べログURL'),
      'https://tabelog.com/tokyo/0000'
    )
    await user.click(screen.getByRole('button', { name: '送信' }))

    expect(onSuccess).toHaveBeenCalledWith(place)
  })

  it('重複登録時にエラーメッセージと既存IDを保持する', async () => {
    // 概要: 重複登録エラー時に重複案内が表示されることを確認する
    // 目的: 既存データへの導線をユーザーに提示できるようにする
    mockFetch(
      {
        errors: { tabelog_url: ['すでに登録されています'] },
        existing_place_id: 99,
      },
      { ok: false, status: 409 }
    )

    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(<RegisterHarness onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('店名'), 'テスト店')
    await user.type(
      screen.getByLabelText('食べログURL'),
      'https://tabelog.com/tokyo/0000'
    )
    await user.click(screen.getByRole('button', { name: '送信' }))

    expect(screen.getByTestId('submit-error')).toHaveTextContent(
      'このURLはすでに登録されています。'
    )
    expect(screen.getByTestId('duplicate-id')).toHaveTextContent('99')
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
