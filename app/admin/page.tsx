import { notFound } from 'next/navigation'
import { getMyProfile } from '@/lib/auth'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'
import type { Metrics, ReportQueueRow } from '@/lib/types'
import ReportRow from './ReportRow'

export const dynamic = 'force-dynamic'

/**
 * 관리자 전용 신고 검토 · 지표 화면.
 *
 * 화면 진입을 is_admin 으로 막지만, 이것만으로는 부족하다.
 * admin_report_queue() · admin_resolve_report() · admin_metrics() RPC
 * 안에서도 각각 is_admin 을 다시 확인한다 (SPEC 4.5 — 화면 숨김만으로는 안 된다).
 */
export default async function AdminPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-slate-500">Supabase 연결 전입니다.</p>
      </main>
    )
  }

  const profile = await getMyProfile()
  if (!profile?.is_admin) notFound()

  const supabase = await createClient()
  const [{ data: queue, error: queueError }, { data: metricsRows, error: metricsError }] =
    await Promise.all([
      supabase.rpc('admin_report_queue'),
      supabase.rpc('admin_metrics'),
    ])

  const rows = (queue as ReportQueueRow[]) ?? []
  const metrics = (metricsRows as Metrics[])?.[0]

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-900">관리자</h1>
      <p className="mt-1 text-sm text-slate-600">
        신고가 3명 이상 겹치면 여기 올라와요. 정지 전까지는 계속 정상 노출돼요.
      </p>

      {metricsError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          지표를 불러오지 못했습니다: {metricsError.message}
        </p>
      )}

      {metrics && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label="가입자 수" value={metrics.가입자수} />
          <MetricCard label="신청 건수" value={metrics.신청건수} />
          <MetricCard label="수락 건수" value={metrics.수락건수} />
          <MetricCard label="대화방 수" value={metrics.대화방수} />
          <MetricCard
            label="대화 이어진 관계 수"
            value={metrics.대화이어진관계수}
            highlight
          />
          <MetricCard
            label="수락률"
            value={metrics.수락률 == null ? '–' : `${metrics.수락률}%`}
          />
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold text-slate-900">
        검토 대기 ({rows.length})
      </h2>

      {queueError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          목록을 불러오지 못했습니다: {queueError.message}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">검토할 신고가 없어요.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((row) => (
            <ReportRow key={row.reported_id} row={row} />
          ))}
        </ul>
      )}
    </main>
  )
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: number | string
  highlight?: boolean
}) {
  return (
    <div
      className={
        highlight
          ? 'rounded-xl bg-brand-600 p-4 text-white'
          : 'rounded-xl bg-white p-4 ring-1 ring-slate-200'
      }
    >
      <p className={highlight ? 'text-xs text-brand-100' : 'text-xs text-slate-500'}>
        {label}
      </p>
      <p className={highlight ? 'mt-1 text-2xl font-bold' : 'mt-1 text-2xl font-bold text-slate-900'}>
        {value}
      </p>
    </div>
  )
}
