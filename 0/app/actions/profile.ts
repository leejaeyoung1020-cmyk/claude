'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MAX_TAGS, isValidBio, isValidNickname } from '@/lib/validation'
import { MAX_AGE, MIN_AGE } from '@/lib/age'
import type { Gender } from '@/lib/types'

export type ProfileState = { error: string | null }

/**
 * 온보딩에서 프로필을 처음 만든다 (SPEC 4.2).
 *
 * 나이는 자격 요건이 아니지만(SPEC 4.1) 대상 연령을 벗어난 출생연도는
 * 입력 실수일 가능성이 높으므로 안내 문구를 띄운다.
 */
export async function createProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const nickname = String(formData.get('nickname') ?? '').trim()
  const birthYear = Number(formData.get('birth_year'))
  const department = String(formData.get('department') ?? '').trim()
  const gender = String(formData.get('gender') ?? '') as Gender
  const bio = String(formData.get('bio') ?? '').trim()
  const tagIds = formData
    .getAll('tag_ids')
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n))

  if (!isValidNickname(nickname)) return { error: '닉네임은 1~12자로 입력해 주세요' }
  if (!Number.isInteger(birthYear)) return { error: '출생연도를 골라 주세요' }
  if (!department) return { error: '학과를 골라 주세요' }
  if (gender !== 'male' && gender !== 'female') return { error: '성별을 골라 주세요' }
  if (!isValidBio(bio)) return { error: '한 줄 소개는 1~60자로 입력해 주세요' }
  if (tagIds.length < 1) return { error: '관심사 태그를 하나 이상 골라 주세요' }
  if (tagIds.length > MAX_TAGS) return { error: `관심사 태그는 최대 ${MAX_TAGS}개까지예요` }

  const currentYear = new Date().getFullYear()
  const age = currentYear - birthYear
  if (age < MIN_AGE || age > MAX_AGE) {
    return { error: `이 서비스는 만 ${MIN_AGE}~${MAX_AGE}세를 대상으로 해요` }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다' }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    nickname,
    birth_year: birthYear,
    department,
    gender,
    bio,
  })
  if (insertError) return { error: insertError.message }

  const { error: tagError } = await supabase
    .from('profile_tags')
    .insert(tagIds.map((tag_id) => ({ profile_id: user.id, tag_id })))
  if (tagError) return { error: tagError.message }

  redirect('/search')
}
