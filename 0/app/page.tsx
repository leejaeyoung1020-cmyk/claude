import Link from 'next/link'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'
import { APP_NAME } from './layout'

export const dynamic = 'force-dynamic'

/**
 * 랜딩 겸 Phase 0 연결 확인 화면.
 * DB가 붙었는지, 시드 데이터가 들어갔는지를 눈으로 볼 수 있어야 한다.
 */
export default async function Home() {
  let status: { ok: boolean; message: string } = {
    ok: false,
    message: '.env.local 이 없습니다 — Supabase URL과 anon key를 넣어 주세요',
  }

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient()
      const [{ count: profiles }, { count: tags }, { count: questions }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('interest_tags').select('*', { count: 'exact', head: true }),
        supabase.from('balance_questions').select('*', { count: 'exact', head: true }),
      ])
      status = {
        ok: true,
        message: `DB 연결됨 · 사용자 ${profiles ?? 0}명 · 태그 ${tags ?? 0}개 · 밸런스게임 질문 ${questions ?? 0}개`,
      }
    } catch (e) {
      status = { ok: false, message: `DB 연결 실패: ${(e as Error).message}` }
    }
  }

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

      <p
        className={
          status.ok
            ? 'mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-800'
            : 'mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800'
        }
      >
        {status.message}
      </p>
    </main>
  )
}
