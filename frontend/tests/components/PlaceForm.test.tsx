import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlaceForm } from '../../src/components/PlaceForm'
import type { FormErrors, FormState } from '../../src/types/place'

const baseFormState: FormState = {
  name: 'テスト店',
  tabelog_url: 'https://tabelog.com/tokyo/0000',
  visit_status: 'not_visited',
  genre: '',
  area: '',
  price_range: '',
  visit_reason: '',
  note: '',
}

describe('PlaceForm', () => {
  it('エラー表示と重複案内を表示する', () => {
    // 概要: エラーと重複案内が渡された場合に描画されることを確認する
    // 目的: APIエラーが画面に反映されることを保証する
    const errors: FormErrors = {
      name: '店名を入力してください',
      tabelog_url: '食べログURLを入力してください',
    }

    render(
      <PlaceForm
        formState={baseFormState}
        errors={errors}
        isSubmitting={false}
        submitError="登録に失敗しました。"
        duplicatePlaceId={10}
        onChange={() => undefined}
        onSubmit={() => undefined}
        onNavigateToDuplicate={() => undefined}
      />
    )

    expect(screen.getByText('店名を入力してください')).toBeInTheDocument()
    expect(screen.getByText('食べログURLを入力してください')).toBeInTheDocument()
    expect(screen.getByText('登録に失敗しました。')).toBeInTheDocument()
    expect(screen.getByText('登録済みデータを確認する')).toBeInTheDocument()
  })

  it('入力変更と送信がハンドラに伝播する', async () => {
    // 概要: 入力変更と送信時に渡されたハンドラが呼ばれることを確認する
    // 目的: 親コンポーネントで状態を更新できることを保証する
    const onChange = vi.fn()
    const onSubmit = vi.fn((event) => event.preventDefault())
    const onNavigateToDuplicate = vi.fn()
    const user = userEvent.setup()

    render(
      <PlaceForm
        formState={baseFormState}
        errors={{}}
        isSubmitting={false}
        submitError={null}
        duplicatePlaceId={null}
        onChange={onChange}
        onSubmit={onSubmit}
        onNavigateToDuplicate={onNavigateToDuplicate}
      />
    )

    await user.type(screen.getByLabelText('店名'), '追加')
    expect(onChange).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '登録する' }))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('送信中はボタンが無効になる', () => {
    // 概要: 送信中フラグが立っている場合にボタンが無効化されることを確認する
    // 目的: 二重送信を防げる状態になっていることを保証する
    render(
      <PlaceForm
        formState={baseFormState}
        errors={{}}
        isSubmitting={true}
        submitError={null}
        duplicatePlaceId={null}
        onChange={() => undefined}
        onSubmit={() => undefined}
        onNavigateToDuplicate={() => undefined}
      />
    )

    expect(screen.getByRole('button', { name: '登録する' })).toBeDisabled()
  })

  it('行った理由の入力値を保持して表示する', () => {
    // 概要: 行った理由の入力値がフォームに表示されることを確認する
    // 目的: 入力エラー時も値が保持されることを保証する
    render(
      <PlaceForm
        formState={{ ...baseFormState, visit_reason: '雰囲気が良さそう' }}
        errors={{ name: '店名を入力してください' }}
        isSubmitting={false}
        submitError={null}
        duplicatePlaceId={null}
        onChange={() => undefined}
        onSubmit={() => undefined}
        onNavigateToDuplicate={() => undefined}
      />
    )

    expect(screen.getByLabelText('行った理由')).toHaveValue(
      '雰囲気が良さそう'
    )
  })
})
