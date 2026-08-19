'use client'

import { useEffect, useState } from 'react'
import type { Profile } from '@/lib/types'
import { getCurrentProfile } from './auth'

/**
 * 로그인 상태를 확인하는 유일한 방법.
 *
 * Supabase 세션이 없으므로 서버(미들웨어)는 로그인 여부를 알 수 없다.
 * 그래서 접근 제한은 전부 클라이언트에서, 마운트된 뒤 localStorage를
 * 읽어서 처리한다. `loading`이 true인 동안에는 아직 판단할 수 없으므로
 * 화면을 리다이렉트하면 안 된다 — 첫 렌더에서 잘못 튕기는 걸 막는다.
 */
export function useCurrentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = () => setProfile(getCurrentProfile())

  useEffect(() => {
    refresh()
    setLoading(false)
  }, [])

  return { profile, loading, refresh }
}
