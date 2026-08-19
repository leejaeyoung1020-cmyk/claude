'use client'

import { useEffect, useState } from 'react'
import { myBlockedProfiles, unblockUser } from '@/lib/mock/api'
import type { ProfileCard } from '@/lib/types'
import Avatar from '@/components/Avatar'

/** 내가 차단한 사람 목록 + 해제 버튼 (SPEC 4.5 — 차단은 언제든 해제할 수 있다) */
export default function BlockedList() {
  const [profiles, setProfiles] = useState<ProfileCard[]>([])

  function load() {
    setProfiles(myBlockedProfiles())
  }

  useEffect(load, [])

  function handleUnblock(id: string) {
    unblockUser(id)
    load()
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-slate-900">숨긴 사람 목록</h2>
      <p className="mt-1 text-sm text-slate-500">
        여기서 해제하면 서로 검색·신청에 다시 나타나요. 상대는 해제 여부를 알 수 없어요.
      </p>

      {profiles.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">숨긴 사람이 없어요.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {profiles.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar photoUrl={p.photo_url} nickname={p.nickname} seed={p.id} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.nickname}</p>
                  <p className="text-xs text-slate-500">{p.department}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUnblock(p.id)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                해제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
