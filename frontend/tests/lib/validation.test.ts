import { describe, expect, it } from 'vitest'
import { isTabelogUrl, validateForm } from '../../src/lib/validation'
import { initialFormState } from '../../src/types/place'

describe('validation', () => {
  it('必須項目が未入力の場合にエラーを返す', () => {
    // 概要: 必須項目が空の状態でバリデーションした場合のエラーを確認する
    // 目的: 必須項目未入力をフロントで検知できることを保証する
    const errors = validateForm({
      ...initialFormState,
      name: '',
      tabelog_url: '',
      visit_status: 'not_visited',
    })

    expect(errors.name).toBe('店名を入力してください')
    expect(errors.tabelog_url).toBe('食べログURLを入力してください')
  })

  it('tabelog.com ドメインのURLだけを許可する', () => {
    // 概要: tabelog.com 以外のURLが弾かれることを確認する
    // 目的: ドメイン制約が期待通りに機能することを保証する
    expect(isTabelogUrl('https://tabelog.com/tokyo/')).toBe(true)
    expect(isTabelogUrl('https://foo.tabelog.com/path')).toBe(true)
    expect(isTabelogUrl('https://example.com')).toBe(false)
  })
})
