'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminMetrics, adminReportQueue } from '@/lib/mock/api'
import { useCurrentProfile } from '@/lib/mock/useCurrentProfile'
import type { Metrics, ReportQueueRow } from '@/lib/types'
import ReportRow from './ReportRow'

/**
 * 관리자 전용 신고 검토 · 지표 화면.
 *
 * 화면 진입을 is_admin 으로 막지만, 이것만으로는 부족하다.
 * adminReportQueue() · adminResolveReport() · adminMetrics()
 * 안에서도 각각 is_admin 을 다시 확인한다 (SPEC 4.5 — 화면 숨김만으로는 안 된다).
 */
export default function AdminPage() {
  const router = useRouter()
  const { profile, loading } = useCurrentProfile()
  const [rows, setRows] = useState<ReportQueueRow[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  function load() {
    const q = adminReportQueue()
    const m = adminMetrics()
    if (q.error !== null) setLoadError(q.error)
    else setRows(q.data)
    if (m.error === null) setMetrics(m.data)
  }

  useEffect(() => {
    if (loading) return
    if (!profile) {
      router.replace('/login')
      return
    }
    if (!profile.is_admin) {
      router.replace('/search')
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile, router])

  if (loading || !profile?.is_admin) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-slate-500">불러오는 중…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-900">관리자</h1>
      <p className="mt-1 text-sm text-slate-600">
        신고가 3명 이상 겹치면 여기 올라와요. 정지 전까지는 계속 정상 노출돼요.
      </p>

      {loadError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      )}

      {metrics && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label="가입자 수" value={metrics.가입자수} />
          <MetricCard label="신청 건수" value={metrics.신청건수} />
          <MetricCard label="수락 건수" value={metrics.수락건수} />
          <MetricCard label="대화방 수" value={metrics.대화방수} />
          <MetricCard label="대화 이어진 관계 수" value={metrics.대화이어진관계수} highlight />
          <MetricCard label="수락률" value={metrics.수락률 == null ? '–' : `${metrics.수락률}%`} />
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold text-slate-900">검토 대기 ({rows.length})</h2>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">검토할 신고가 없어요.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((row) => (
            <ReportRow key={row.reported_id} row={row} onResolved={load} />
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
      <p className={highlight ? 'text-xs text-brand-100' : 'text-xs text-slate-500'}>{label}</p>
      <p className={highlight ? 'mt-1 text-2xl font-bold' : 'mt-1 text-2xl font-bold text-slate-900'}>
        {value}
      </p>
    </div>
  )
}
