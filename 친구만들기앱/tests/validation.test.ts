import { describe, expect, it } from 'vitest'
import {
  isSchoolEmail,
  isValidBio,
  isValidGreeting,
  isValidNickname,
  isValidTagSelection,
} from '@/lib/validation'

describe('isSchoolEmail', () => {
  it('학교 이메일을 통과시킨다', () => {
    expect(isSchoolEmail('hong@kyonggi.ac.kr')).toBe(true)
  })

  it('대소문자와 앞뒤 공백을 무시한다', () => {
    expect(isSchoolEmail('  Hong@Kyonggi.AC.KR  ')).toBe(true)
  })

  it('다른 도메인을 막는다', () => {
    expect(isSchoolEmail('hong@gmail.com')).toBe(false)
    expect(isSchoolEmail('hong@naver.com')).toBe(false)
  })

  it('학교 도메인을 앞에 끼워 넣은 주소를 막는다', () => {
    // 여기서 "포함" 검사를 썼다면 통과해 버린다
    expect(isSchoolEmail('hong@kyonggi.ac.kr.evil.com')).toBe(false)
    expect(isSchoolEmail('kyonggi.ac.kr@gmail.com')).toBe(false)
  })

  it('서브도메인은 막는다', () => {
    expect(isSchoolEmail('hong@mail.kyonggi.ac.kr')).toBe(false)
  })

  it('형태가 아닌 값을 막는다', () => {
    expect(isSchoolEmail('')).toBe(false)
    expect(isSchoolEmail('kyonggi.ac.kr')).toBe(false)
    expect(isSchoolEmail('@kyonggi.ac.kr')).toBe(false)
    expect(isSchoolEmail('ho ng@kyonggi.ac.kr')).toBe(false)
  })
})

describe('인사말 (SPEC 4.4 — 필수, 1~200자)', () => {
  it('빈 인사말을 막는다', () => {
    expect(isValidGreeting('')).toBe(false)
    expect(isValidGreeting('   ')).toBe(false)
  })

  it('1자도 통과시킨다', () => {
    expect(isValidGreeting('!')).toBe(true)
  })

  it('200자를 넘으면 막는다', () => {
    expect(isValidGreeting('가'.repeat(200))).toBe(true)
    expect(isValidGreeting('가'.repeat(201))).toBe(false)
  })
})

describe('닉네임과 한 줄 소개', () => {
  it('닉네임은 12자까지', () => {
    expect(isValidNickname('가'.repeat(12))).toBe(true)
    expect(isValidNickname('가'.repeat(13))).toBe(false)
    expect(isValidNickname('  ')).toBe(false)
  })

  it('한 줄 소개는 60자까지', () => {
    expect(isValidBio('가'.repeat(60))).toBe(true)
    expect(isValidBio('가'.repeat(61))).toBe(false)
  })
})

describe('관심사 태그 (SPEC 4.2 — 최대 5개)', () => {
  it('5개까지 통과시킨다', () => {
    expect(isValidTagSelection([1, 2, 3, 4, 5])).toBe(true)
  })

  it('6개는 막는다', () => {
    expect(isValidTagSelection([1, 2, 3, 4, 5, 6])).toBe(false)
  })

  it('하나도 안 고르면 막는다', () => {
    expect(isValidTagSelection([])).toBe(false)
  })
})
