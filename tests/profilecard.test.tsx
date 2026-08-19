import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProfileCard from '@/components/ProfileCard'
import type { ProfileCard as ProfileCardType } from '@/lib/types'

const PROFILE: ProfileCardType = {
  id: 'u9',
  nickname: '주원',
  birth_year: 2004,
  department: '산업경영공학과',
  gender: 'male',
  bio: '사진 찍으러 다녀요',
  photo_url: null,
  tag_labels: ['사진', '여행', '영화'],
}

describe('ProfileCard', () => {
  it('닉네임 · 나이 · 학과 · 태그 · 한 줄 소개를 보여준다', () => {
    render(<ProfileCard profile={PROFILE} currentYear={2026} />)

    expect(screen.getByText('주원')).toBeInTheDocument()
    expect(screen.getByText('22세 · 산업경영공학과')).toBeInTheDocument()
    expect(screen.getByText('사진 찍으러 다녀요')).toBeInTheDocument()
    expect(screen.getByText('사진')).toBeInTheDocument()
    expect(screen.getByText('여행')).toBeInTheDocument()
  })

  it('카드 전체가 상대 프로필로 가는 링크다', () => {
    render(<ProfileCard profile={PROFILE} currentYear={2026} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/profile/u9')
  })
})
