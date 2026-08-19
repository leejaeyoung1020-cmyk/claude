'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { hasCompletedProfile, isSuspended } from '@/lib/mock/auth'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import { getMyConversations } from '@/lib/mock/api'
import { BALANCE_QUESTIONS } from '@/lib/mock/seed'

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function Loading() {
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <p className="text-sm text-slate-500">불러오는 중…</p>
    </main>
  )
}

/**
 * 폰을 책상에 두고 두 사람이 함께 보는 화면이다. 답을 저장하지 않는다 —
 * 선택 버튼도, 입력창도, 서버 호출도 만들지 않는다 (SPEC 4.6).
 */
export default function MeetPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = params.id
  const { profile, loading } = useCurrentProfile()

  const [access, setAccess] = useState<'loading' | 'granted' | 'denied'>('loading')
  const [order, setOrder] = useState<number[] | null>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (loading) return
    if (!profile) router.replace('/login')
    else if (!hasCompletedProfile(profile)) router.replace('/onboarding')
    else if (isSuspended(profile)) router.replace('/suspended')
  }, [loading, profile, router])

  useEffect(() => {
    if (loading || !profile) return
    const conv = getMyConversations().find((c) => c.conversationId === conversationId)
    setAccess(conv ? 'granted' : 'denied')
  }, [loading, profile, conversationId])

  useEffect(() => {
    setOrder(shuffle(BALANCE_QUESTIONS.map((q) => q.id)))
  }, [])

  const question = useMemo(() => {
    if (!order) return null
    const id = order[index]
    return BALANCE_QUESTIONS.find((q) => q.id === id) ?? null
  }, [order, index])

  if (loading || !profile || !hasCompletedProfile(profile) || isSuspended(profile) || access === 'loading' || !order) {
    return <Loading />
  }

  if (access === 'denied') {
    return (
      <main className="mx-auto max-w-lg px-6 py-10">
        <p className="text-sm text-slate-600">접근할 수 없어요.</p>
      </main>
    )
  }

  const done = index >= order.length

  return (
    <main className="flex min-h-screen flex-col bg-brand-900 px-6 py-8 text-white">
      <Link href={`/chat/${conversationId}`} className="text-sm text-brand-200 hover:text-white">
        ← 나가기
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        {done ? (
          <>
            <p className="text-3xl font-bold">질문을 다 봤어요</p>
            <button
              type="button"
              onClick={() => {
                setOrder(shuffle(BALANCE_QUESTIONS.map((q) => q.id)))
                setIndex(0)
              }}
              className="rounded-xl bg-white px-6 py-3 text-lg font-semibold text-brand-900"
            >
              처음부터 다시
            </button>
          </>
        ) : (
          question && (
            <>
              <p className="text-4xl font-bold leading-snug">{question.optionA}</p>
              <p className="text-xl text-brand-200">vs</p>
              <p className="text-4xl font-bold leading-snug">{question.optionB}</p>
            </>
          )
        )}
      </div>

      {!done && (
        <button
          type="button"
          onClick={() => setIndex((i) => i + 1)}
          className="rounded-xl bg-white px-6 py-4 text-xl font-semibold text-brand-900"
        >
          다음 질문
        </button>
      )}
    </main>
  )
}
