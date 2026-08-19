'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProfile } from '@/lib/mock/auth'
import { DEPARTMENTS } from '@/lib/departments'
import { MAX_AGE, MIN_AGE } from '@/lib/age'
import type { Gender, Tag } from '@/lib/types'
import TagPicker from '@/components/TagPicker'

export default function OnboardingForm({ tags }: { tags: Tag[] }) {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [department, setDepartment] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [bio, setBio] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from(
    { length: MAX_AGE - MIN_AGE + 1 },
    (_, i) => currentYear - MIN_AGE - i,
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const result = createProfile({
      nickname,
      birthYear: Number(birthYear),
      department,
      gender: gender as Gender,
      bio,
      tagIds: selected,
    })
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/search')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-slate-700">
          닉네임
        </label>
        <input
          id="nickname"
          maxLength={12}
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
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
            required
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
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
                className={
                  gender === value
                    ? 'flex-1 cursor-pointer rounded-lg border border-brand-600 bg-brand-50 px-3 py-2.5 text-center text-brand-900'
                    : 'flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center'
                }
              >
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={gender === value}
                  onChange={() => setGender(value)}
                  required
                  className="sr-only"
                />
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
          required
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
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
              ({selected.length}/5)
            </span>
          </span>
        </div>
        <div className="mt-2">
          <TagPicker tags={tags} selected={selected} onChange={setSelected} />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
          한 줄 소개
        </label>
        <input
          id="bio"
          maxLength={60}
          required
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="예) 같이 헬스장 갈 사람 구해요"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
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
