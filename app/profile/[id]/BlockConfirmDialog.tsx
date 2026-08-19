'use client'

import { useState } from 'react'
import { blockUser } from '@/lib/mock/api'

/** 차단 확인 모달. 제재·정지라는 단어를 쓰지 않는다 — 차단은 벌이 아니라 개인 선택이다 (SPEC 4.5) */
export default function BlockConfirmDialog({
  targetId,
  onClose,
  onBlocked,
}: {
  targetId: string
  onClose: () => void
  onBlocked: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function confirm() {
    setPending(true)
    const result = blockUser(targetId)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onBlocked()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">이 사람을 숨길까요?</h2>
        <p className="mt-2 text-sm text-slate-600">
          서로에게 보이지 않게 됩니다. 상대는 알 수 없어요. 언제든 해제할 수 있습니다.
        </p>

        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? '숨기는 중…' : '숨기기'}
          </button>
        </div>
      </div>
    </div>
  )
}
