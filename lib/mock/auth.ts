import type { Gender, Profile } from '@/lib/types'
import { isSchoolEmail, isValidBio, isValidNickname, MAX_TAGS } from '@/lib/validation'
import { MAX_AGE, MIN_AGE } from '@/lib/age'
import { getCurrentUserId, getStore, persist, randomId, setCurrentUserId } from './store'

/**
 * 시뮬레이션 로그인 (2026-08-19 결정 — Supabase 전혀 쓰지 않음).
 *
 * 학교 이메일 도메인만 확인하고, 이 브라우저의 localStorage에
 * "지금 로그인한 사람"을 표시한다. 서버도 비밀번호도 없다 —
 * 한 대의 브라우저 = 한 명의 사용자라는 전제의 데모용 로그인이다.
 * 이메일이 이미 존재하면 그 사람으로, 없으면 프로필 없는 새 계정으로 들어간다.
 */
export function signInWithSchoolEmail(email: string): { error: string | null } {
  const value = email.trim().toLowerCase()
  if (!value) return { error: '이메일을 입력해 주세요' }
  if (!isSchoolEmail(value)) {
    return { error: '경기대학교 이메일(@kyonggi.ac.kr)만 사용할 수 있습니다' }
  }

  const store = getStore()
  let profile = store.profiles.find((p) => p.email === value)

  if (!profile) {
    profile = {
      id: randomId('u'),
      email: value,
      nickname: '',
      birth_year: 0,
      department: '',
      gender: 'male',
      bio: '',
      photo_url: null,
      is_admin: false,
      suspended_until: null,
      suspend_reason: null,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    }
    store.profiles.push(profile)
    persist(store)
  }

  setCurrentUserId(profile.id)
  return { error: null }
}

export function signOut() {
  setCurrentUserId(null)
}

export function getCurrentProfile(): Profile | null {
  const id = getCurrentUserId()
  if (!id) return null
  const store = getStore()
  return store.profiles.find((p) => p.id === id) ?? null
}

/** 시드 계정은 email이 없으므로 온보딩 여부는 닉네임 존재로 판정한다 */
export function hasCompletedProfile(profile: Profile | null): boolean {
  return Boolean(profile?.nickname)
}

export function isSuspended(profile: Pick<Profile, 'suspended_until'> | null): boolean {
  if (!profile?.suspended_until) return false
  return new Date(profile.suspended_until).getTime() > Date.now()
}

export type CreateProfileInput = {
  nickname: string
  birthYear: number
  department: string
  gender: Gender
  bio: string
  tagIds: number[]
}

export function createProfile(input: CreateProfileInput): { error: string | null } {
  const id = getCurrentUserId()
  if (!id) return { error: '로그인이 필요합니다' }

  if (!isValidNickname(input.nickname)) return { error: '닉네임은 1~12자로 입력해 주세요' }
  if (!Number.isInteger(input.birthYear)) return { error: '출생연도를 골라 주세요' }
  if (!input.department) return { error: '학과를 골라 주세요' }
  if (input.gender !== 'male' && input.gender !== 'female') return { error: '성별을 골라 주세요' }
  if (!isValidBio(input.bio)) return { error: '한 줄 소개는 1~60자로 입력해 주세요' }
  if (input.tagIds.length < 1) return { error: '관심사 태그를 하나 이상 골라 주세요' }
  if (input.tagIds.length > MAX_TAGS) return { error: `관심사 태그는 최대 ${MAX_TAGS}개까지예요` }

  const age = new Date().getFullYear() - input.birthYear
  if (age < MIN_AGE || age > MAX_AGE) {
    return { error: `이 서비스는 만 ${MIN_AGE}~${MAX_AGE}세를 대상으로 해요` }
  }

  const store = getStore()
  const profile = store.profiles.find((p) => p.id === id)
  if (!profile) return { error: '계정을 찾을 수 없습니다' }

  profile.nickname = input.nickname.trim()
  profile.birth_year = input.birthYear
  profile.department = input.department
  profile.gender = input.gender
  profile.bio = input.bio.trim()

  store.profileTags = store.profileTags.filter((t) => t.profile_id !== id)
  store.profileTags.push(...input.tagIds.map((tag_id) => ({ profile_id: id, tag_id })))

  persist(store)
  return { error: null }
}

export type UpdateProfileInput = CreateProfileInput & { photoUrl?: string | null }

/** 이미 프로필이 있는 사람이 내용을 고칠 때 쓴다. photoUrl을 생략하면 기존 사진을 그대로 둔다 */
export function updateProfile(input: UpdateProfileInput): { error: string | null } {
  const id = getCurrentUserId()
  if (!id) return { error: '로그인이 필요합니다' }

  if (!isValidNickname(input.nickname)) return { error: '닉네임은 1~12자로 입력해 주세요' }
  if (!Number.isInteger(input.birthYear)) return { error: '출생연도를 골라 주세요' }
  if (!input.department) return { error: '학과를 골라 주세요' }
  if (input.gender !== 'male' && input.gender !== 'female') return { error: '성별을 골라 주세요' }
  if (!isValidBio(input.bio)) return { error: '한 줄 소개는 1~60자로 입력해 주세요' }
  if (input.tagIds.length < 1) return { error: '관심사 태그를 하나 이상 골라 주세요' }
  if (input.tagIds.length > MAX_TAGS) return { error: `관심사 태그는 최대 ${MAX_TAGS}개까지예요` }

  const age = new Date().getFullYear() - input.birthYear
  if (age < MIN_AGE || age > MAX_AGE) {
    return { error: `이 서비스는 만 ${MIN_AGE}~${MAX_AGE}세를 대상으로 해요` }
  }

  const store = getStore()
  const profile = store.profiles.find((p) => p.id === id)
  if (!profile) return { error: '계정을 찾을 수 없습니다' }

  profile.nickname = input.nickname.trim()
  profile.birth_year = input.birthYear
  profile.department = input.department
  profile.gender = input.gender
  profile.bio = input.bio.trim()
  if (input.photoUrl !== undefined) profile.photo_url = input.photoUrl

  store.profileTags = store.profileTags.filter((t) => t.profile_id !== id)
  store.profileTags.push(...input.tagIds.map((tag_id) => ({ profile_id: id, tag_id })))

  persist(store)
  return { error: null }
}
