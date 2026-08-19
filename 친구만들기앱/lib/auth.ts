import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

/**
 * 시연 전용 로그인 방식 (2026-08-19 결정).
 *
 * 사용자는 @kyonggi.ac.kr 이메일 한 칸만 입력하면 로그인된다.
 * 내부적으로는 이메일에서 만들어낸 고정 비밀번호로 Supabase 계정을
 * 자동 생성·로그인시킨다. 그래서 세션·RLS·auth.uid() 는 전부 진짜로 동작한다.
 *
 * !!! 이 방식은 시연 전용이다 !!!
 * 이메일 주소만 알면 그 사람으로 로그인할 수 있다.
 * 실제 학생을 받기로 결정하면 반드시 이메일 인증코드(OTP)로 되돌려야 한다.
 * SPEC 4.1 과 7장(운영 범위)에 같은 내용을 적어 두었다.
 */
export function demoPassword(email: string): string {
  return `kgu-demo-2026:${email.trim().toLowerCase()}`
}

/** 로그인한 사용자의 프로필. 없으면 null (아직 온보딩 전) */
export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return (data as Profile) ?? null
}

export function isSuspended(profile: Pick<Profile, 'suspended_until'> | null): boolean {
  if (!profile?.suspended_until) return false
  return new Date(profile.suspended_until).getTime() > Date.now()
}
