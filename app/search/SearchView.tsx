'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { searchProfiles, type SearchFilters } from '@/lib/mock/api'
import { STORAGE_KEY } from '@/lib/mock/store'
import { defaultSearchFilters, fromQuery, toQuery } from '@/lib/searchParams'
import { TAGS } from '@/lib/mock/seed'
import { DEPARTMENTS } from '@/lib/departments'
import { MAX_AGE, MIN_AGE } from '@/lib/age'
import type { ProfileCard as ProfileCardType } from '@/lib/types'
import ProfileCard from '@/components/ProfileCard'
import TagPicker from '@/components/TagPicker'
import NavBar from '@/components/NavBar'

const MY_DEPARTMENT_VALUE = '__mine__'
const GENDER_OPTIONS = [
  [null, '상관없음'],
  ['male', '남'],
  ['female', '여'],
] as const

/**
 * 검색 화면. 필터 상태는 URL 쿼리에 둔다 — 새로고침해도 필터가 유지된다 (SPEC 4.3).
 * 태그 필터는 프로필 편집과 달리 개수 제한이 없어야 하므로 TagPicker에
 * maxCount={전체 태그 개수}를 넘겨 사실상 무제한으로 만든다.
 */
export default function SearchView({ myDepartment }: { myDepartment: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = useMemo(() => fromQuery(searchParams), [searchParams])
  const [results, setResults] = useState<ProfileCardType[] | null>(null)

  useEffect(() => {
    setResults(searchProfiles(filters))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return
      setResults(searchProfiles(filters))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function apply(patch: Partial<SearchFilters>) {
    const query = toQuery({ ...filters, ...patch })
    router.replace(query.toString() ? `${pathname}?${query.toString()}` : pathname)
  }

  function reset() {
    router.replace(pathname)
  }

  const isDefault = JSON.stringify(filters) === JSON.stringify(defaultSearchFilters())
  const departmentValue = filters.department === myDepartment ? MY_DEPARTMENT_VALUE : filters.department ?? ''

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-6 py-6">
        <h1 className="text-2xl font-bold text-brand-900">검색</h1>
        <p className="mt-1 text-sm text-slate-600">조건을 걸어 같이 뭔가 할 사람을 찾아보세요.</p>

        <div className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <span className="block text-sm font-medium text-slate-700">성별</span>
            <div className="mt-1 flex gap-2">
              {GENDER_OPTIONS.map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => apply({ gender: value })}
                  className={
                    filters.gender === value
                      ? 'flex-1 rounded-lg border border-brand-600 bg-brand-50 px-3 py-2 text-sm text-brand-900'
                      : 'flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700">
              나이대 <span className="font-normal text-slate-500">({filters.minAge}~{filters.maxAge}세)</span>
            </span>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={MIN_AGE}
                max={MAX_AGE}
                value={filters.minAge}
                aria-label="최소 나이"
                onChange={(e) => apply({ minAge: Math.min(Number(e.target.value), filters.maxAge) })}
                className="w-full"
              />
              <input
                type="range"
                min={MIN_AGE}
                max={MAX_AGE}
                value={filters.maxAge}
                aria-label="최대 나이"
                onChange={(e) => apply({ maxAge: Math.max(Number(e.target.value), filters.minAge) })}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-slate-700">
              학과
            </label>
            <select
              id="department"
              value={departmentValue}
              onChange={(e) => {
                const value = e.target.value
                if (value === MY_DEPARTMENT_VALUE) apply({ department: myDepartment })
                else apply({ department: value || null })
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            >
              <option value="">전체</option>
              <option value={MY_DEPARTMENT_VALUE}>내 학과만</option>
              {DEPARTMENTS.filter((d) => d !== myDepartment).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700">관심사 태그</span>
            <div className="mt-2">
              <TagPicker
                tags={TAGS}
                selected={filters.tagIds}
                onChange={(tagIds) => apply({ tagIds })}
                maxCount={TAGS.length}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {results === null && <p className="text-sm text-slate-500">불러오는 중…</p>}
          {results !== null && results.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-600">조건을 넓혀보세요</p>
              {!isDefault && (
                <button
                  type="button"
                  onClick={reset}
                  className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  필터 초기화
                </button>
              )}
            </div>
          )}
          {results?.map((profile) => <ProfileCard key={profile.id} profile={profile} />)}
        </div>
      </main>
    </>
  )
}
