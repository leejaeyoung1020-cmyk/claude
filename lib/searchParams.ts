import type { Gender } from '@/lib/types'
import { MAX_AGE, MIN_AGE } from '@/lib/age'
import type { SearchFilters } from '@/lib/mock/api'

/**
 * 검색 화면의 필터 상태를 URL 쿼리 문자열과 왕복 변환한다.
 * 필터를 건 상태로 새로고침해도 유지되게 하려고 상태를 URL에 둔다.
 */
export function defaultSearchFilters(): Required<SearchFilters> {
  return { gender: null, minAge: MIN_AGE, maxAge: MAX_AGE, department: null, tagIds: [] }
}

export function toQuery(filters: SearchFilters): URLSearchParams {
  const defaults = defaultSearchFilters()
  const params = new URLSearchParams()

  if (filters.gender) params.set('gender', filters.gender)
  if (filters.minAge != null && filters.minAge !== defaults.minAge) params.set('minAge', String(filters.minAge))
  if (filters.maxAge != null && filters.maxAge !== defaults.maxAge) params.set('maxAge', String(filters.maxAge))
  if (filters.department) params.set('department', filters.department)
  if (filters.tagIds && filters.tagIds.length > 0) params.set('tagIds', filters.tagIds.join(','))

  return params
}

export function fromQuery(params: URLSearchParams): Required<SearchFilters> {
  const defaults = defaultSearchFilters()
  const gender = params.get('gender')
  const department = params.get('department')
  const tagIds = params.get('tagIds')

  return {
    gender: gender === 'male' || gender === 'female' ? (gender as Gender) : null,
    minAge: parseAge(params.get('minAge'), defaults.minAge),
    maxAge: parseAge(params.get('maxAge'), defaults.maxAge),
    department: department || null,
    tagIds: tagIds ? tagIds.split(',').map(Number).filter(Number.isFinite) : [],
  }
}

function parseAge(value: string | null, fallback: number): number {
  if (value == null) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
