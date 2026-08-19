export const SCHOOL_DOMAIN = 'kyonggi.ac.kr'

/**
 * 경기대학교 이메일인지 확인한다 (SPEC 4.1).
 *
 * 여기서 확인하는 것은 화면에서 빠르게 걸러 주기 위한 것이고,
 * 진짜 방어선은 DB 트리거(supabase/migrations/004_email_guard.sql)다.
 * 화면 검증만 두면 API 를 직접 호출하는 경우를 막지 못한다.
 *
 * `a@kyonggi.ac.kr.evil.com` 같은 주소를 통과시키지 않도록
 * "포함"이 아니라 "정확히 그 도메인으로 끝나는지"를 본다.
 */
export function isSchoolEmail(email: string): boolean {
  const value = email.trim().toLowerCase()
  const at = value.lastIndexOf('@')
  if (at <= 0) return false

  const local = value.slice(0, at)
  const domain = value.slice(at + 1)

  if (local.length === 0) return false
  if (/\s/.test(value)) return false

  return domain === SCHOOL_DOMAIN
}

/** 친구 신청 인사말 (SPEC 4.4 — 필수, 1~200자) */
export function isValidGreeting(greeting: string): boolean {
  const value = greeting.trim()
  return value.length >= 1 && value.length <= 200
}

/** 닉네임 1~12자 */
export function isValidNickname(nickname: string): boolean {
  const value = nickname.trim()
  return value.length >= 1 && value.length <= 12
}

/** 한 줄 소개 1~60자 */
export function isValidBio(bio: string): boolean {
  const value = bio.trim()
  return value.length >= 1 && value.length <= 60
}

/** 관심사 태그는 최대 5개 (SPEC 4.2) */
export const MAX_TAGS = 5

export function isValidTagSelection(tagIds: number[]): boolean {
  return tagIds.length >= 1 && tagIds.length <= MAX_TAGS
}
