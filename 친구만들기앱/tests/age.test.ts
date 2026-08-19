import { describe, expect, it } from 'vitest'
import { ageFromBirthYear, birthYearRange } from '@/lib/age'

describe('ageFromBirthYear', () => {
  it('연도 차이로 나이를 낸다', () => {
    expect(ageFromBirthYear(2002, 2026)).toBe(24)
  })

  it('대상 연령 경계를 확인한다', () => {
    expect(ageFromBirthYear(2007, 2026)).toBe(19)
    expect(ageFromBirthYear(1996, 2026)).toBe(30)
  })
})

describe('birthYearRange', () => {
  it('나이 범위를 출생연도 범위로 뒤집는다', () => {
    // 19~30세를 찾으려면 1996~2007년생을 찾아야 한다
    expect(birthYearRange(19, 30, 2026)).toEqual({ from: 1996, to: 2007 })
  })

  it('뒤집은 범위가 원래 나이와 맞아떨어진다', () => {
    const { from, to } = birthYearRange(20, 25, 2026)
    expect(ageFromBirthYear(to, 2026)).toBe(20)
    expect(ageFromBirthYear(from, 2026)).toBe(25)
  })
})
