'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { hasCompletedProfile, isSuspended } from '@/lib/mock/auth'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import { getConversationMessages, getMyConversations, markConversationRead, sendMessage } from '@/lib/mock/api'
import { reloadFromStorage, STORAGE_KEY } from '@/lib/mock/store'
import type { Message, ProfileCard } from '@/lib/types'
import Avatar from '@/components/Avatar'
import NavBar from '@/components/NavBar'
import MessageBubble from '@/components/MessageBubble'

function Loading() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <p className="text-sm text-slate-500">불러오는 중…</p>
    </main>
  )
}

export default function ChatRoomPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = params.id
  const { profile, loading } = useCurrentProfile()

  const [access, setAccess] = useState<'loading' | 'granted' | 'denied'>('loading')
  const [peer, setPeer] = useState<ProfileCard | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (!hasCompletedProfile(profile)) router.replace('/onboarding')
    else if (isSuspended(profile)) router.replace('/suspended')
  }, [loading, profile, router])

  useEffect(() => {
    if (loading || !profile) return
    // getConversationMessages()는 참여자가 아니면 빈 배열을 주지만, 새로 수락돼
    // 메시지가 0개인 정상 대화방도 빈 배열이라 그것만으로는 구별할 수 없다.
    // 그래서 접근 판정은 getMyConversations()에 이 방이 있는지로 한다.
    const conv = getMyConversations().find((c) => c.conversationId === conversationId)
    if (!conv) {
      setAccess('denied')
      return
    }
    setAccess('granted')
    setPeer(conv.peer)
    setMessages(getConversationMessages(conversationId))
    markConversationRead(conversationId)
  }, [loading, profile, conversationId])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return
      reloadFromStorage()
      setMessages(getConversationMessages(conversationId))
      markConversationRead(conversationId)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (loading || !profile || !hasCompletedProfile(profile) || isSuspended(profile) || access === 'loading') {
    return <Loading />
  }

  if (access === 'denied') {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-lg px-6 py-10">
          <p className="text-sm text-slate-600">접근할 수 없어요.</p>
        </main>
      </>
    )
  }

  function send() {
    setError(null)
    const result = sendMessage(conversationId, draft)
    if (result.error) {
      setError(result.error)
      return
    }
    setDraft('')
    setMessages(getConversationMessages(conversationId))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto flex h-[calc(100vh-72px)] max-w-lg flex-col px-6 py-6">
        {peer && (
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <Avatar photoUrl={peer.photo_url} nickname={peer.nickname} seed={peer.id} />
              <p className="font-semibold text-slate-900">{peer.nickname}</p>
            </div>
            <Link
              href={`/chat/${conversationId}/meet`}
              className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
            >
              만났어요
            </Link>
          </div>
        )}

        <div className="flex-1 space-y-2 overflow-y-auto py-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} body={m.body} createdAt={m.created_at} isMine={m.sender_id === profile.id} />
          ))}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex items-end gap-2 border-t border-slate-200 pt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={1000}
            placeholder="메시지 보내기"
            className="max-h-24 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={send}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
          >
            전송
          </button>
        </div>
      </main>
    </>
  )
}
