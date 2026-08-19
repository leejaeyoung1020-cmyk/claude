'use client'

import { useState } from 'react'
import { sendFriendRequest } from '@/lib/mock/api'

/** 친구 신청 인사말 입력 모달. 1~200자, 성공하면 onSent()로 부모에 알린다 */
export default function GreetingDialog({
  targetId,
  onClose,
  onSent,
}: {
  targetId: string
  onClose: () => void
  onSent: () => void
}) {
  const [greeting, setGreeting] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function submit() {
    setPending(true)
    const result = sendFriendRequest(targetId, greeting)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onSent()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">인사말 남기기</h2>
        <p className="mt-1 text-sm text-slate-600">수락 전까지 상대에게 전달되는 건 이 한 줄뿐이에요.</p>

        <textarea
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          maxLength={200}
          rows={4}
          placeholder="예) 안녕하세요! 관심사가 비슷해서 연락드려요"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <p className="mt-1 text-right text-xs text-slate-400">{greeting.length}/200</p>

        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
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
            onClick={submit}
            disabled={pending}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {pending ? '보내는 중…' : '신청 보내기'}
          </button>
        </div>
      </div>
    </div>
  )
}
