'use client'

import { useState } from 'react'
import { adminResolveReport } from '@/lib/mock/api'
import { REPORT_REASON_LABEL, type ReportQueueRow } from '@/lib/types'

/**
 * 신고 검토 대기 목록 한 줄.
 *
 * 아바타는 임시로 이니셜만 보여준다. B의 components/Avatar.tsx가
 * 나오면 교체한다.
 */
export default function ReportRow({
  row,
  onResolved,
}: {
  row: ReportQueueRow
  onResolved: () => void
}) {
  const [days, setDays] = useState(30)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const suspended =
    row.suspended_until && new Date(row.suspended_until).getTime() > Date.now()

  function resolve(action: 'dismissed' | 'warned' | 'suspended') {
    setPending(true)
    const result = adminResolveReport(row.reported_id, action, days)
    setPending(false)
    if (result.error) setError(result.error)
    else onResolved()
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-900">
            {row.nickname.slice(0, 1)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {row.nickname}
              <span className="ml-1.5 font-normal text-slate-500">· {row.department}</span>
            </p>
            <p className="text-sm text-slate-500">
              서로 다른 신고자 <span className="font-semibold text-red-600">{row.reporter_count}명</span>
              {' · '}
              최근 {new Date(row.latest_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>

        {suspended && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            정지 중 (~{new Date(row.suspended_until!).toLocaleDateString('ko-KR')})
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {[...new Set(row.reasons)].map((r) => (
          <span key={r} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {REPORT_REASON_LABEL[r]}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => resolve('dismissed')}
          disabled={pending}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          기각
        </button>
        <button
          type="button"
          onClick={() => resolve('warned')}
          disabled={pending}
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-60"
        >
          경고
        </button>

        <div className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-2 py-1">
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-14 bg-transparent text-sm text-red-800 outline-none"
          />
          <span className="text-sm text-red-700">일</span>
          <button
            type="button"
            onClick={() => resolve('suspended')}
            disabled={pending}
            className="rounded-md bg-red-600 px-2.5 py-1 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
          >
            정지
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  )
}
