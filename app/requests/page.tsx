'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { hasCompletedProfile, isSuspended } from '@/lib/mock/auth'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import { getMyFriendRequests, respondFriendRequest, type FriendRequestRow } from '@/lib/mock/api'
import { STORAGE_KEY } from '@/lib/mock/store'
import { ageFromBirthYear } from '@/lib/age'
import Avatar from '@/components/Avatar'
import NavBar from '@/components/NavBar'

function Loading() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <p className="text-sm text-slate-500">불러오는 중…</p>
    </main>
  )
}

const TAB_CLASS = {
  active: 'flex-1 rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white',
  inactive: 'flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm text-slate-700',
}

export default function RequestsPage() {
  const router = useRouter()
  const { profile, loading } = useCurrentProfile()
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [received, setReceived] = useState<FriendRequestRow[]>([])
  const [sent, setSent] = useState<FriendRequestRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (!hasCompletedProfile(profile)) router.replace('/onboarding')
    else if (isSuspended(profile)) router.replace('/suspended')
  }, [loading, profile, router])

  function refresh() {
    const result = getMyFriendRequests()
    setReceived(result.received.filter((r) => r.status === 'pending'))
    setSent(result.sent)
  }

  useEffect(() => {
    if (loading || !profile) return
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile])

  useEffect(() => {
    if (loading || !profile) return
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return
      refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile])

  if (loading || !profile || !hasCompletedProfile(profile) || isSuspended(profile)) {
    return <Loading />
  }

  function respond(id: string, accept: boolean) {
    setError(null)
    const result = respondFriendRequest(id, accept)
    if (result.error) {
      setError(result.error)
      return
    }
    if (accept && result.data) {
      router.push(`/chat/${result.data}`)
      return
    }
    refresh()
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-lg px-6 py-10">
        <h1 className="text-2xl font-bold text-brand-900">신청함</h1>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setTab('received')} className={tab === 'received' ? TAB_CLASS.active : TAB_CLASS.inactive}>
            받은 신청{received.length > 0 ? ` (${received.length})` : ''}
          </button>
          <button type="button" onClick={() => setTab('sent')} className={tab === 'sent' ? TAB_CLASS.active : TAB_CLASS.inactive}>
            보낸 신청
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <div className="mt-4 space-y-3">
          {tab === 'received' &&
            (received.length === 0 ? (
              <p className="text-sm text-slate-500">받은 신청이 없어요.</p>
            ) : (
              received.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <Link href={`/profile/${r.peer.id}`} className="flex items-center gap-3">
                    <Avatar photoUrl={r.peer.photo_url} nickname={r.peer.nickname} seed={r.peer.id} />
                    <div>
                      <p className="font-semibold text-slate-900">{r.peer.nickname}</p>
                      <p className="text-xs text-slate-500">
                        {ageFromBirthYear(r.peer.birth_year)}세 · {r.peer.department}
                      </p>
                    </div>
                  </Link>
                  <p className="mt-2 text-sm text-slate-700">&ldquo;{r.greeting}&rdquo;</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => respond(r.id, true)}
                      className="flex-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500"
                    >
                      수락
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(r.id, false)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))
            ))}

          {tab === 'sent' &&
            (sent.length === 0 ? (
              <p className="text-sm text-slate-500">보낸 신청이 없어요.</p>
            ) : (
              sent.map((r) => (
                <Link
                  key={r.id}
                  href={`/profile/${r.peer.id}`}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <Avatar photoUrl={r.peer.photo_url} nickname={r.peer.nickname} seed={r.peer.id} />
                    <p className="font-medium text-slate-900">{r.peer.nickname}</p>
                  </div>
                  <span className="text-sm text-slate-500">{r.status === 'accepted' ? '수락됨' : '대기 중'}</span>
                </Link>
              ))
            ))}
        </div>
      </main>
    </>
  )
}
