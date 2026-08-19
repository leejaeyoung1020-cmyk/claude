'use client'

import { useState } from 'react'
import type { Tag } from '@/lib/types'
import TagChip from './TagChip'

/**
 * 관심사 태그 선택기. 고정 목록에서만 고른다 — 자유 입력창은 만들지 않는다 (SPEC 4.2).
 * 프로필 편집(maxCount=5)과 검색 필터(제한 없음)에서 같은 컴포넌트를 쓴다.
 */
export default function TagPicker({
  tags,
  selected,
  onChange,
  maxCount = 5,
}: {
  tags: Tag[]
  selected: number[]
  onChange: (next: number[]) => void
  maxCount?: number
}) {
  const [notice, setNotice] = useState<string | null>(null)

  function toggle(id: number) {
    if (selected.includes(id)) {
      setNotice(null)
      onChange(selected.filter((t) => t !== id))
      return
    }
    if (maxCount != null && selected.length >= maxCount) {
      setNotice(`최대 ${maxCount}개까지 고를 수 있어요`)
      return
    }
    setNotice(null)
    onChange([...selected, id])
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagChip key={tag.id} label={tag.label} selected={selected.includes(tag.id)} onClick={() => toggle(tag.id)} />
        ))}
      </div>
      {notice && <p className="mt-2 text-xs text-amber-700">{notice}</p>}
    </div>
  )
}
