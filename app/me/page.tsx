'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasCompletedProfile, isSuspended, signOut } from '@/lib/mock/auth'
import { myTagIds } from '@/lib/mock/api'
import { resetStore } from '@/lib/mock/store'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import NavBar from '@/components/NavBar'
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

  function handleLogout() {
    signOut()
    router.replace('/login')
  }

  function handleReset() {
    if (!window.confirm('정말 초기화할까요? 지금까지 만든 데이터가 전부 시드 상태로 돌아갑니다.')) return
    resetStore()
    router.replace('/login')
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-900">내 프로필</h1>
      <p className="mt-1 text-sm text-slate-600">태그가 가장 먼저 보여요. 사진은 안 올려도 괜찮습니다.</p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <ProfileForm profile={profile} initialTagIds={myTagIds()} onSaved={refresh} />
      </div>

      <BlockedList />

      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
        <button type="button" onClick={handleLogout} className="text-slate-500 hover:text-slate-700">
          로그아웃
        </button>
        <button type="button" onClick={handleReset} className="text-slate-400 hover:text-red-700">
          시뮬레이션 데이터 초기화
        </button>
      </div>
      </main>
    </>
  )
}
