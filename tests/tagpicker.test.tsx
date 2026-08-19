import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import TagPicker from '@/components/TagPicker'

const TAGS = [
  { id: 1, label: '운동·헬스' },
  { id: 2, label: '러닝' },
  { id: 3, label: '등산' },
  { id: 4, label: '게임' },
  { id: 5, label: '영화' },
  { id: 6, label: '음악' },
]

describe('TagPicker — 최대 개수 (SPEC 4.2)', () => {
  it('선택 개수가 maxCount에 도달하면 추가 클릭이 onChange를 호출하지 않는다', () => {
    const onChange = vi.fn()
    render(<TagPicker tags={TAGS} selected={[1, 2, 3, 4, 5]} onChange={onChange} maxCount={5} />)

    fireEvent.click(screen.getByRole('button', { name: '음악' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('최대 5개까지 고를 수 있어요')).toBeInTheDocument()
  })

  it('선택 해제는 개수 제한과 무관하게 항상 가능하다', () => {
    const onChange = vi.fn()
    render(<TagPicker tags={TAGS} selected={[1, 2, 3, 4, 5]} onChange={onChange} maxCount={5} />)

    fireEvent.click(screen.getByRole('button', { name: '운동·헬스' }))

    expect(onChange).toHaveBeenCalledWith([2, 3, 4, 5])
  })

  it('제한 미달이면 클릭한 태그가 선택 목록에 추가된다', () => {
    const onChange = vi.fn()
    render(<TagPicker tags={TAGS} selected={[1, 2]} onChange={onChange} maxCount={5} />)

    fireEvent.click(screen.getByRole('button', { name: '등산' }))

    expect(onChange).toHaveBeenCalledWith([1, 2, 3])
  })

  it('maxCount를 생략하면 기본값 5가 적용된다', () => {
    const onChange = vi.fn()
    render(<TagPicker tags={TAGS} selected={[1, 2, 3, 4, 5]} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '음악' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('자유 입력창을 렌더링하지 않는다 (SPEC 4.2 — 고정 목록만)', () => {
    render(<TagPicker tags={TAGS} selected={[]} onChange={vi.fn()} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
