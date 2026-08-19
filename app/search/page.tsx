'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasCompletedProfile, isSuspended } from '@/lib/mock/auth'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import SearchView from './SearchView'

function Loading() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm text-slate-500">불러오는 중…</p>
    </main>
  )
}

export default function SearchPage() {
  const router = useRouter()
  const { profile, loading } = useCurrentProfile()

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (!hasCompletedProfile(profile)) router.replace('/onboarding')
    else if (isSuspended(profile)) router.replace('/suspended')
  }, [loading, profile, router])

  if (loading || !profile || !hasCompletedProfile(profile) || isSuspended(profile)) {
    return <Loading />
  }

  return (
    <Suspense fallback={<Loading />}>
      <SearchView myDepartment={profile.department} />
    </Suspense>
  )
}
