'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { hasCompletedProfile, isSuspended } from '@/lib/mock/auth'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import { getMyConversations, type ConversationSummary } from '@/lib/mock/api'
import Avatar from '@/components/Avatar'
import NavBar from '@/components/NavBar'

function Loading() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <p className="text-sm text-slate-500">불러오는 중…</p>
    </main>
  )
}

function formatLastTime(iso: string) {
  const date = new Date(iso)
  const isToday = date.toDateString() === new Date().toDateString()
  return isToday
    ? date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

export default function ChatListPage() {
  const router = useRouter()
  const { profile, loading } = useCurrentProfile()
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null)

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (!hasCompletedProfile(profile)) router.replace('/onboarding')
    else if (isSuspended(profile)) router.replace('/suspended')
  }, [loading, profile, router])

  useEffect(() => {
    if (loading || !profile) return
    setConversations(getMyConversations())
  }, [loading, profile])

  if (loading || !profile || !hasCompletedProfile(profile) || isSuspended(profile) || conversations === null) {
    return <Loading />
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-lg px-6 py-10">
        <h1 className="text-2xl font-bold text-brand-900">채팅</h1>

        {conversations.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">아직 대화가 없어요. 검색에서 친구를 찾아보세요.</p>
            <Link
              href="/search"
              className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
            >
              검색하러 가기
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {conversations.map((c) => (
              <Link
                key={c.conversationId}
                href={`/chat/${c.conversationId}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-brand-300"
              >
                <Avatar photoUrl={c.peer.photo_url} nickname={c.peer.nickname} seed={c.peer.id} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{c.peer.nickname}</p>
                  <p className="truncate text-sm text-slate-500">{c.lastMessage ?? '대화를 시작해 보세요'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {c.lastMessageAt && <span className="text-xs text-slate-400">{formatLastTime(c.lastMessageAt)}</span>}
                  {c.unread > 0 && (
                    <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
