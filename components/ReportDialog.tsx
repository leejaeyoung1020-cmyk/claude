'use client'

import { useState } from 'react'
import { reportUser } from '@/lib/mock/api'
import { REPORT_REASON_LABEL, type ReportReason } from '@/lib/types'

const REASONS: ReportReason[] = ['abuse', 'sexual', 'spam', 'pressure', 'impersonation', 'other']

/**
 * 신고 다이얼로그. 신고하면 신고자·대상이 자동으로 상호 차단된다 (SPEC 4.5).
 * 차단과 문구·동작을 명확히 구분한다 — 여기서는 "제재/정지" 같은 단어를 쓰지 않는다.
 */
export default function ReportDialog({
  targetId,
  onClose,
  onSubmitted,
}: {
  targetId: string
  onClose: () => void
  onSubmitted?: () => void
}) {
  const [reason, setReason] = useState<ReportReason>('abuse')
  const [detail, setDetail] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function submit() {
    setPending(true)
    const result = reportUser(targetId, reason, detail.trim() || undefined)
    setPending(false)
    if (result.error) {
      setError(result.error)
      setConfirming(false)
      return
    }
    onSubmitted?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        {!confirming ? (
          <>
            <h2 className="text-lg font-bold text-slate-900">신고하기</h2>

            <fieldset className="mt-4 space-y-2">
              <legend className="text-sm font-medium text-slate-700">사유를 골라 주세요</legend>
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {REPORT_REASON_LABEL[r]}
                </label>
              ))}
            </fieldset>

            <label htmlFor="report-detail" className="mt-4 block text-sm font-medium text-slate-700">
              자세히 (선택)
            </label>
            <textarea
              id="report-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />

            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
              >
                신고하기
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-900">신고할까요?</h2>
            <p className="mt-2 text-sm text-slate-600">
              규칙 위반을 관리자에게 알립니다. 신고하면 서로 자동으로 숨겨집니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                돌아가기
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
              >
                {pending ? '신고하는 중…' : '신고 확정'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
