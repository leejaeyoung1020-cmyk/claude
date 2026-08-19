'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getStore } from '@/lib/mock/store'
import { TAGS, BALANCE_QUESTIONS } from '@/lib/mock/seed'
import { APP_NAME } from '@/lib/appName'

/**
 * 랜딩 겸 시뮬레이션 상태 확인 화면.
 * 서버가 없으므로 "연결"은 없고, localStorage에 시드가 들어갔는지만 보여준다.
 */
export default function Home() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    setCount(getStore().profiles.length)
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-medium text-brand-600">경기대학교</p>
        <h1 className="mt-1 text-3xl font-bold text-brand-900">{APP_NAME}</h1>
        <p className="mt-3 text-slate-600">
          같이 밥 먹을 사람, 같이 운동할 사람, 공모전 팀원.
          <br />
          목적은 상관없어요. 함께할 사람을 찾아보세요.
        </p>

        <Link
          href="/login"
          className="mt-6 block rounded-lg bg-brand-600 px-4 py-3 text-center font-medium text-white transition hover:bg-brand-500"
        >
          학교 이메일로 시작하기
        </Link>
      </div>

      <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-800">
        {count === null
          ? '불러오는 중…'
          : `시뮬레이션 모드 · 사용자 ${count}명 · 태그 ${TAGS.length}개 · 밸런스게임 질문 ${BALANCE_QUESTIONS.length}개`}
      </p>
    </main>
  )
}
