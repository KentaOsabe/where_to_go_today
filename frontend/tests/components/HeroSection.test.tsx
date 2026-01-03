import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroSection } from '../../src/components/HeroSection'

describe('HeroSection', () => {
  it('ヒーローの見出しとヒントを表示する', () => {
    // 概要: ヒーローセクションの主要コピーが描画されることを確認する
    // 目的: 登録導線の説明が画面に表示されることを保証する
    render(<HeroSection />)

    expect(
      screen.getByRole('heading', { name: '今日の候補を、最小入力で。' })
    ).toBeInTheDocument()
    expect(screen.getByText('タブ移動だけで完結します。入力途中でも内容は保持されます。')).toBeInTheDocument()
  })
})
