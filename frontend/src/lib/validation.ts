import type { FormErrors, FormState } from '../types/place'

export const isTabelogUrl = (value: string) => {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }
    const host = url.hostname.toLowerCase()
    return host === 'tabelog.com' || host.endsWith('.tabelog.com')
  } catch {
    return false
  }
}

export const validateForm = (state: FormState): FormErrors => {
  const nextErrors: FormErrors = {}
  if (!state.name.trim()) {
    nextErrors.name = '店名を入力してください'
  }
  const tabelogUrl = state.tabelog_url.trim()
  if (!tabelogUrl) {
    nextErrors.tabelog_url = '食べログURLを入力してください'
  } else if (!isTabelogUrl(tabelogUrl)) {
    nextErrors.tabelog_url = 'tabelog.com ドメインのURLを入力してください'
  }
  if (!state.visit_status) {
    nextErrors.visit_status = '来店ステータスを選択してください'
  }
  return nextErrors
}
