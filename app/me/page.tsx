'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasCompletedProfile, isSuspended } from '@/lib/mock/auth'
import { myTagIds } from '@/lib/mock/api'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import ProfileForm from './ProfileForm'
import BlockedList from './BlockedList'

export default function MePage() {
  const router = useRouter()
  const { profile, loading, refresh } = useCurrentProfile()

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (!hasCompletedProfile(profile)) router.replace('/onboarding')
    else if (isSuspended(profile)) router.replace('/suspended')
  }, [loading, profile, router])

  if (loading || !profile || !hasCompletedProfile(profile) || isSuspended(profile)) {
    return (
      <main className="mx-auto max-w-lg px-6 py-10">
        <p className="text-sm text-slate-500">불러오는 중…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-900">내 프로필</h1>
      <p className="mt-1 text-sm text-slate-600">태그가 가장 먼저 보여요. 사진은 안 올려도 괜찮습니다.</p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <ProfileForm profile={profile} initialTagIds={myTagIds()} onSaved={refresh} />
      </div>

      <BlockedList />
    </main>
  )
}
