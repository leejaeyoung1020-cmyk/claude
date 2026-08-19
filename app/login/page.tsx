'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentProfile, hasCompletedProfile, isSuspended, signInWithSchoolEmail } from '@/lib/mock/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const profile = getCurrentProfile()
    if (!profile) return
    if (isSuspended(profile)) router.replace('/suspended')
    else if (hasCompletedProfile(profile)) router.replace('/search')
    else router.replace('/onboarding')
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const result = signInWithSchoolEmail(email)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    const profile = getCurrentProfile()
    router.push(hasCompletedProfile(profile) ? '/search' : '/onboarding')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-brand-900">재학생 확인</h1>
        <p className="mt-2 text-sm text-slate-600">
          경기대학교 이메일 주소를 입력하면 바로 시작할 수 있어요.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              학교 이메일
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hong@kyonggi.ac.kr"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              @kyonggi.ac.kr 주소만 사용할 수 있어요
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-500 disabled:opacity-60"
          >
            {pending ? '확인 중…' : '시작하기'}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        시뮬레이션 빌드입니다. 서버 없이 이 브라우저 안에만 데이터가 저장됩니다.
      </p>
    </main>
  )
}
