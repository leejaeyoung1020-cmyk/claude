import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageBubble from '@/components/MessageBubble'

describe('MessageBubble', () => {
  it('메시지 내용과 시각을 보여준다', () => {
    render(<MessageBubble body="안녕하세요" createdAt="2026-08-20T03:04:00.000Z" isMine={false} />)
    expect(screen.getByText('안녕하세요')).toBeInTheDocument()
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('내 메시지는 오른쪽 정렬 표시가, 상대 메시지는 왼쪽 정렬 표시가 붙는다', () => {
    const { container: mine } = render(<MessageBubble body="내 메시지" createdAt="2026-08-20T03:04:00.000Z" isMine />)
    expect(mine.querySelector('[data-mine="true"]')).toBeInTheDocument()

    const { container: theirs } = render(
      <MessageBubble body="상대 메시지" createdAt="2026-08-20T03:04:00.000Z" isMine={false} />,
    )
    expect(theirs.querySelector('[data-mine="false"]')).toBeInTheDocument()
  })
})
