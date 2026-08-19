'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TAGS } from '@/lib/mock/seed'
import { hasCompletedProfile } from '@/lib/mock/auth'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import OnboardingForm from './OnboardingForm'

export default function OnboardingPage() {
  const router = useRouter()
  const { profile, loading } = useCurrentProfile()

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (hasCompletedProfile(profile)) router.replace('/search')
  }, [loading, profile, router])

  if (loading || !profile || hasCompletedProfile(profile)) {
    return (
      <main className="mx-auto max-w-lg px-6 py-10">
        <p className="text-sm text-slate-500">불러오는 중…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-900">프로필 만들기</h1>
      <p className="mt-2 text-sm text-slate-600">
        관심사 태그가 이 앱의 첫인상이에요. 사진보다 태그를 먼저 봅니다.
      </p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <OnboardingForm tags={TAGS} />
      </div>
    </main>
  )
}
