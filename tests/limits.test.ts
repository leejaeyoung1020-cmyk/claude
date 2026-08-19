import { describe, expect, it } from 'vitest'
import { DAILY_REQUEST_LIMIT, remainingRequests } from '@/lib/limits'

describe('remainingRequests (SPEC 4.4 — 하루 5건)', () => {
  it('상한은 5다', () => {
    expect(DAILY_REQUEST_LIMIT).toBe(5)
  })

  it('아직 안 보냈으면 5건 남는다', () => {
    expect(remainingRequests(0)).toBe(5)
  })

  it('보낸 만큼 줄어든다', () => {
    expect(remainingRequests(1)).toBe(4)
    expect(remainingRequests(4)).toBe(1)
  })

  it('다 쓰면 0이다', () => {
    expect(remainingRequests(5)).toBe(0)
  })

  it('상한을 넘겨도 음수가 되지 않는다', () => {
    expect(remainingRequests(7)).toBe(0)
  })

  it('이상한 값이 와도 화면이 깨지지 않는다', () => {
    expect(remainingRequests(-1)).toBe(5)
    expect(remainingRequests(Number.NaN)).toBe(5)
  })
})
