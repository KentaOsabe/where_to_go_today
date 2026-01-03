import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('必須項目の未入力を検知してエラーを表示する', async () => {
    // 概要: 必須項目が空のまま送信した場合にエラーを表示する
    // 目的: 未入力のまま送信できないことを保証する
    render(<App />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(screen.getByText('店名を入力してください')).toBeInTheDocument()
    expect(screen.getByText('食べログURLを入力してください')).toBeInTheDocument()
  })

  it('tabelog.com 以外のURLを拒否して理由を表示する', async () => {
    // 概要: tabelog.com 以外のURLを入力した場合にエラーを表示する
    // 目的: ドメイン制約がフロントでも機能することを確認する
    render(<App />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('店名'), 'テスト店')
    await user.type(
      screen.getByLabelText(/食べログURL/),
      'https://example.com'
    )
    await user.click(screen.getByRole('button', { name: '登録する' }))

    expect(screen.queryByText('店名を入力してください')).not.toBeInTheDocument()
    expect(
      screen.getByText('tabelog.com ドメインのURLを入力してください')
    ).toBeInTheDocument()
  })
})
