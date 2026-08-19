'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { hasCompletedProfile, isSuspended } from '@/lib/mock/auth'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import { getProfileById, hasSentRequestTo, remainingRequestsToday } from '@/lib/mock/api'
import { ageFromBirthYear } from '@/lib/age'
import { DAILY_REQUEST_LIMIT } from '@/lib/limits'
import type { ProfileCard as ProfileCardType } from '@/lib/types'
import Avatar from '@/components/Avatar'
import TagChip from '@/components/TagChip'
import NavBar from '@/components/NavBar'
import GreetingDialog from './GreetingDialog'

function Loading() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <p className="text-sm text-slate-500">불러오는 중…</p>
    </main>
  )
}

export default function ProfileDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const targetId = params.id
  const { profile, loading } = useCurrentProfile()

  const [target, setTarget] = useState<ProfileCardType | null | undefined>(undefined)
  const [sent, setSent] = useState(false)
  const [remaining, setRemaining] = useState(DAILY_REQUEST_LIMIT)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (!hasCompletedProfile(profile)) router.replace('/onboarding')
    else if (isSuspended(profile)) router.replace('/suspended')
  }, [loading, profile, router])

  useEffect(() => {
    if (loading || !profile) return
    setTarget(getProfileById(targetId))
    setSent(hasSentRequestTo(targetId))
    setRemaining(remainingRequestsToday())
  }, [loading, profile, targetId])

  if (loading || !profile || !hasCompletedProfile(profile) || isSuspended(profile) || target === undefined) {
    return <Loading />
  }

  if (target === null) {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-lg px-6 py-10">
          <p className="text-sm text-slate-600">찾을 수 없는 프로필입니다.</p>
        </main>
      </>
    )
  }

  const age = ageFromBirthYear(target.birth_year)
  const sentToday = DAILY_REQUEST_LIMIT - remaining

  function handleSent() {
    setSent(true)
    setDialogOpen(false)
    setRemaining(remainingRequestsToday())
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-4">
            <Avatar photoUrl={target.photo_url} nickname={target.nickname} seed={target.id} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{target.nickname}</h1>
              <p className="text-sm text-slate-500">
                {age}세 · {target.department}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {target.tag_labels.map((label) => (
              <TagChip key={label} label={label} selected />
            ))}
          </div>

          <p className="mt-4 text-slate-700">{target.bio}</p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              disabled={sent}
              onClick={() => setDialogOpen(true)}
              className={
                sent
                  ? 'flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-center font-medium text-slate-400'
                  : 'flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center font-medium text-white transition hover:bg-brand-500'
              }
            >
              {sent ? '신청함 (대기 중)' : '친구 신청'}
            </button>
            <span className="text-sm text-slate-500">
              오늘 {sentToday}/{DAILY_REQUEST_LIMIT}
            </span>
          </div>
        </div>
      </main>

      {dialogOpen && <GreetingDialog targetId={target.id} onClose={() => setDialogOpen(false)} onSent={handleSent} />}
    </>
  )
}
