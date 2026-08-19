'use client'

import { useActionState, useState } from 'react'
import { createProfile, type ProfileState } from '@/app/actions/profile'
import { DEPARTMENTS } from '@/lib/departments'
import { MAX_TAGS } from '@/lib/validation'
import { MAX_AGE, MIN_AGE } from '@/lib/age'
import type { Tag } from '@/lib/types'

const initial: ProfileState = { error: null }

/**
 * 온보딩 폼.
 *
 * 태그 선택 부분은 임시 구현이다.
 * B가 components/TagPicker.tsx 를 완성하면 그것으로 교체한다 (팀 규칙: 같은 컴포넌트를 두 개 만들지 않는다).
 */
export default function OnboardingForm({ tags }: { tags: Tag[] }) {
  const [state, formAction, pending] = useActionState(createProfile, initial)
  const [selected, setSelected] = useState<number[]>([])
  const [tagNotice, setTagNotice] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from(
    { length: MAX_AGE - MIN_AGE + 1 },
    (_, i) => currentYear - MIN_AGE - i,
  )

  function toggleTag(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        setTagNotice(null)
        return prev.filter((t) => t !== id)
      }
      if (prev.length >= MAX_TAGS) {
        setTagNotice(`최대 ${MAX_TAGS}개까지 고를 수 있어요`)
        return prev
      }
      setTagNotice(null)
      return [...prev, id]
    })
  }

  return (
    <form action={formAction} className="space-y-6">
      {selected.map((id) => (
        <input key={id} type="hidden" name="tag_ids" value={id} />
      ))}

      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-slate-700">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          maxLength={12}
          required
          placeholder="12자까지"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="birth_year" className="block text-sm font-medium text-slate-700">
            출생연도
          </label>
          <select
            id="birth_year"
            name="birth_year"
            required
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
          >
            <option value="" disabled>
              선택
            </option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}년 ({currentYear - y}세)
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700">성별</span>
          <div className="mt-1 flex gap-2">
            {(
              [
                ['male', '남'],
                ['female', '여'],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-900"
              >
                <input type="radio" name="gender" value={value} required className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium text-slate-700">
          학과
        </label>
        <select
          id="department"
          name="department"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
        >
          <option value="" disabled>
            선택
          </option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="block text-sm font-medium text-slate-700">
            관심사 태그
            <span className="ml-1 text-xs font-normal text-slate-500">
              ({selected.length}/{MAX_TAGS})
            </span>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const on = selected.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                aria-pressed={on}
                className={
                  on
                    ? 'rounded-full bg-brand-600 px-3 py-1.5 text-sm text-white'
                    : 'rounded-full bg-brand-50 px-3 py-1.5 text-sm text-brand-900 ring-1 ring-brand-100'
                }
              >
                {tag.label}
              </button>
            )
          })}
        </div>
        {tagNotice && <p className="mt-2 text-xs text-amber-700">{tagNotice}</p>}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
          한 줄 소개
        </label>
        <input
          id="bio"
          name="bio"
          maxLength={60}
          required
          placeholder="예) 같이 헬스장 갈 사람 구해요"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-500 disabled:opacity-60"
      >
        {pending ? '저장 중…' : '시작하기'}
      </button>

      <p className="text-center text-xs text-slate-500">
        프로필 사진은 나중에 내 프로필에서 올릴 수 있어요. 없어도 괜찮습니다.
      </p>
    </form>
  )
}
