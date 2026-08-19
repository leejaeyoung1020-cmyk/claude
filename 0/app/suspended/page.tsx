import { getMyProfile, isSuspended } from '@/lib/auth'
import { signOut } from '@/app/actions/auth'
import { hasSupabaseEnv } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// [확인 필요] 문의를 받을 실제 주소로 바꾼다.
const CONTACT_EMAIL = 'leejaeyoung1020@kyonggi.ac.kr'

export default async function SuspendedPage() {
  const profile = hasSupabaseEnv() ? await getMyProfile() : null
  const suspended = isSuspended(profile)

  const until = profile?.suspended_until
    ? new Date(profile.suspended_until).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold text-slate-900">이용이 제한되었습니다</h1>

        {suspended ? (
          <>
            <p className="mt-3 text-sm text-slate-600">
              {profile?.suspend_reason ??
                '신고가 누적되어 관리자 검토 후 이용이 제한되었습니다.'}
            </p>
            {until && (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                해제 예정일 <span className="font-semibold">{until}</span>
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            현재 제한 상태가 아닙니다. 검색 화면으로 돌아가 주세요.
          </p>
        )}

        <p className="mt-4 text-sm text-slate-600">
          내용에 이의가 있으면 아래 주소로 알려 주세요.
          <br />
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 underline">
            {CONTACT_EMAIL}
          </a>
        </p>

        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            로그아웃
          </button>
        </form>
      </div>
    </main>
  )
}
