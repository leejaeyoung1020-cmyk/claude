'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { demoPassword } from '@/lib/auth'
import { isSchoolEmail } from '@/lib/validation'

export type AuthState = { error: string | null }

/**
 * 학교 이메일만 입력하면 로그인된다 (시연 전용 — lib/auth.ts 주석 참고).
 *
 * 1) 이미 있는 계정이면 그대로 로그인
 * 2) 없으면 자동으로 만들고 로그인
 * 3) 프로필이 있으면 /search, 없으면 /onboarding
 */
export async function signInWithSchoolEmail(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  if (!email) return { error: '이메일을 입력해 주세요' }
  if (!isSchoolEmail(email)) {
    return { error: '경기대학교 이메일(@kyonggi.ac.kr)만 사용할 수 있습니다' }
  }

  const supabase = await createClient()
  const password = demoPassword(email)

  const first = await supabase.auth.signInWithPassword({ email, password })

  if (first.error) {
    const created = await supabase.auth.signUp({ email, password })

    if (created.error) {
      // DB 트리거(004_email_guard.sql)가 막은 경우도 여기로 온다
      return { error: created.error.message }
    }
    if (!created.data.session) {
      return {
        error:
          '계정은 만들어졌지만 로그인되지 않았습니다. Supabase 대시보드에서 Authentication → Sign In / Providers → Email 의 "Confirm email" 을 꺼 주세요.',
      }
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인에 실패했습니다. 다시 시도해 주세요' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  redirect(profile ? '/search' : '/onboarding')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
