import { describe, expect, it } from 'vitest'
import { defaultSearchFilters, fromQuery, toQuery } from '@/lib/searchParams'

describe('lib/searchParams — 검색 필터 URL 직렬화', () => {
  it('기본 필터는 성별 상관없음(null), 나이 19~30, 학과 상관없음(null), 태그 없음이다', () => {
    expect(defaultSearchFilters()).toEqual({
      gender: null,
      minAge: 19,
      maxAge: 30,
      department: null,
      tagIds: [],
    })
  })

  it('필터를 쿼리로 바꿨다가 다시 필터로 되돌리면 원래 값과 같다', () => {
    const filters = { gender: 'female' as const, minAge: 20, maxAge: 25, department: '컴퓨터공학부', tagIds: [4, 9] }
    const query = toQuery(filters)
    expect(fromQuery(query)).toEqual(filters)
  })

  it('빈 쿼리는 기본 필터로 되돌아온다', () => {
    expect(fromQuery(new URLSearchParams())).toEqual(defaultSearchFilters())
  })

  it('기본 필터는 쿼리에 아무 항목도 넣지 않는다', () => {
    const query = toQuery(defaultSearchFilters())
    expect(query.toString()).toBe('')
  })
})
