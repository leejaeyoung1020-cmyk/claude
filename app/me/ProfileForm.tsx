'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/mock/auth'
import { DEPARTMENTS } from '@/lib/departments'
import { MAX_AGE, MIN_AGE } from '@/lib/age'
import { MAX_TAGS } from '@/lib/validation'
import type { Gender, Profile } from '@/lib/types'
import TagPicker from '@/components/TagPicker'
import Avatar from '@/components/Avatar'
import { TAGS } from '@/lib/mock/seed'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export default function ProfileForm({
  profile,
  initialTagIds,
  onSaved,
}: {
  profile: Profile
  initialTagIds: number[]
  onSaved: () => void
}) {
  const [nickname, setNickname] = useState(profile.nickname)
  const [birthYear, setBirthYear] = useState(String(profile.birth_year))
  const [department, setDepartment] = useState(profile.department)
  const [gender, setGender] = useState<Gender>(profile.gender)
  const [bio, setBio] = useState(profile.bio)
  const [selected, setSelected] = useState<number[]>(initialTagIds)
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photo_url)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from(
    { length: MAX_AGE - MIN_AGE + 1 },
    (_, i) => currentYear - MIN_AGE - i,
  )

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoError('이미지 파일만 올릴 수 있어요')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('5MB 이하 사진만 올릴 수 있어요')
      return
    }

    setPhotoError(null)
    const reader = new FileReader()
    reader.onload = () => setPhotoUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    setPending(true)
    const result = updateProfile({
      nickname,
      birthYear: Number(birthYear),
      department,
      gender,
      bio,
      tagIds: selected,
      photoUrl,
    })
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setError(null)
    setSaved(true)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar photoUrl={photoUrl} nickname={nickname || profile.nickname} seed={profile.id} size="lg" />
        <div>
          <label className="inline-block cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
            사진 올리기
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
          </label>
          {photoUrl && (
            <button
              type="button"
              onClick={() => setPhotoUrl(null)}
              className="ml-2 text-sm text-slate-500 underline"
            >
              사진 지우기
            </button>
          )}
          <p className="mt-1 text-xs text-slate-500">사진은 선택이에요. 없어도 괜찮습니다 (5MB 이하)</p>
          {photoError && <p className="mt-1 text-xs text-red-700">{photoError}</p>}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="nickname" className="block text-sm font-medium text-slate-700">
            닉네임
          </label>
          <span className="text-xs text-slate-500">{nickname.length}/12</span>
        </div>
        <input
          id="nickname"
          maxLength={12}
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
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
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-lg font-semibold text-slate-900">
          관심사 태그
          <span className="ml-1 text-xs font-normal text-slate-500">
            ({selected.length}/{MAX_TAGS})
          </span>
        </span>
        <div className="mt-2">
          <TagPicker tags={TAGS} selected={selected} onChange={setSelected} />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
            한 줄 소개
          </label>
          <span className="text-xs text-slate-500">{bio.length}/60</span>
        </div>
        <input
          id="bio"
          maxLength={60}
          required
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">저장했어요</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-500 disabled:opacity-60"
      >
        {pending ? '저장 중…' : '저장하기'}
      </button>
    </form>
  )
}
