import { beforeEach, describe, expect, it } from 'vitest'
import {
  adminMetrics,
  adminReportQueue,
  adminResolveReport,
  blockUser,
  getConversationMessages,
  getMyConversations,
  pendingReceivedRequestCount,
  reportUser,
  searchProfiles,
  sendFriendRequest,
  sendMessage,
} from '@/lib/mock/api'
import { getStore, resetStore, setCurrentUserId } from '@/lib/mock/store'

/**
 * lib/mock/api.ts는 예전 supabase/migrations/003_functions.sql의 RPC를
 * 그대로 옮긴 것이다. 옮기면서 규칙이 깨지지 않았는지 여기서 확인한다.
 */

beforeEach(() => {
  resetStore()
  setCurrentUserId('u1')
})

describe('sendFriendRequest — 하루 5건 상한 (SPEC 4.4)', () => {
  // u11은 시드 데이터에 신청 이력이 없는 사람이라 상한 계산이 깔끔하다.
  beforeEach(() => setCurrentUserId('u11'))

  it('서로 다른 5명에게 신청하면 통과한다', () => {
    const targets = ['u3', 'u5', 'u6', 'u7', 'u8']
    for (const id of targets) {
      const result = sendFriendRequest(id, '안녕하세요')
      expect(result.error).toBeNull()
    }
  })

  it('6번째 신청은 막힌다', () => {
    for (const id of ['u3', 'u5', 'u6', 'u7', 'u8']) sendFriendRequest(id, '안녕하세요')
    const sixth = sendFriendRequest('u10', '안녕하세요')
    expect(sixth.error).toBe('하루에 보낼 수 있는 신청은 5건입니다')
  })

  it('인사말이 없으면 막힌다', () => {
    const result = sendFriendRequest('u3', '   ')
    expect(result.error).toBe('인사말을 입력해 주세요')
  })

  it('같은 사람에게 두 번 신청하면 막힌다', () => {
    sendFriendRequest('u3', '안녕하세요')
    const again = sendFriendRequest('u3', '또 왔어요')
    expect(again.error).toBe('이미 신청한 상대입니다')
  })
})

describe('blockUser — 양방향, 상대는 모른다 (SPEC 4.5)', () => {
  it('내가 차단하면 검색 결과에서 서로 사라진다', () => {
    blockUser('u2')
    const myResults = searchProfiles()
    expect(myResults.find((p) => p.id === 'u2')).toBeUndefined()

    setCurrentUserId('u2')
    const theirResults = searchProfiles()
    expect(theirResults.find((p) => p.id === 'u1')).toBeUndefined()
  })

  it('차단 후 친구 신청은 막힌다', () => {
    blockUser('u2')
    const result = sendFriendRequest('u2', '안녕하세요')
    expect(result.error).toBe('신청할 수 없는 상대입니다')
  })
})

describe('reportUser — 3명 이상이어야 검토 대기, 자동 정지 없음 (SPEC 4.5)', () => {
  beforeEach(() => {
    const store = getStore()
    const admin = store.profiles.find((p) => p.id === 'u1')!
    admin.is_admin = true
  })

  it('신고자가 2명뿐이면 관리자 목록에 안 뜬다', () => {
    setCurrentUserId('u2')
    reportUser('u10', 'abuse')
    setCurrentUserId('u3')
    reportUser('u10', 'abuse')

    setCurrentUserId('u1')
    const queue = adminReportQueue()
    expect(queue.data?.find((r) => r.reported_id === 'u10')).toBeUndefined()
  })

  it('서로 다른 신고자 3명이면 목록에 뜨지만, 자동으로 정지되지는 않는다', () => {
    for (const reporter of ['u2', 'u3', 'u6']) {
      setCurrentUserId(reporter)
      reportUser('u10', 'abuse')
    }

    setCurrentUserId('u1')
    const queue = adminReportQueue()
    const row = queue.data?.find((r) => r.reported_id === 'u10')
    expect(row?.reporter_count).toBe(3)

    const target = getStore().profiles.find((p) => p.id === 'u10')!
    expect(target.suspended_until).toBeNull()
  })

  it('신고하면 신고자와 대상은 자동으로 상호 차단된다', () => {
    setCurrentUserId('u2')
    reportUser('u10', 'abuse')
    const store = getStore()
    expect(store.blocks.some((b) => b.blocker_id === 'u2' && b.blocked_id === 'u10')).toBe(true)
    expect(store.blocks.some((b) => b.blocker_id === 'u10' && b.blocked_id === 'u2')).toBe(true)
  })

  it('관리자가 정지 처리해야만 정지된다', () => {
    for (const reporter of ['u2', 'u3', 'u6']) {
      setCurrentUserId(reporter)
      reportUser('u10', 'abuse')
    }
    setCurrentUserId('u1')
    adminResolveReport('u10', 'suspended', 30)

    const target = getStore().profiles.find((p) => p.id === 'u10')!
    expect(target.suspended_until).not.toBeNull()
  })

  it('관리자가 아니면 신고 목록을 볼 수 없다', () => {
    setCurrentUserId('u2')
    const queue = adminReportQueue()
    expect(queue.error).toBe('관리자만 볼 수 있습니다')
  })
})

describe('채팅 (SPEC 4.4)', () => {
  it('시드 대화방(c1, u4-u9)이 목록에 보인다', () => {
    setCurrentUserId('u4')
    const list = getMyConversations()
    expect(list.find((c) => c.conversationId === 'c1')).toBeTruthy()
  })

  it('내 대화방이 아니면 메시지를 볼 수도 보낼 수도 없다', () => {
    setCurrentUserId('u2') // c1 참여자가 아니다
    expect(getConversationMessages('c1')).toEqual([])
    const result = sendMessage('c1', '안녕하세요')
    expect(result.error).toBe('접근할 수 없는 대화방입니다')
  })

  it('빈 메시지는 전송되지 않는다', () => {
    setCurrentUserId('u4')
    const result = sendMessage('c1', '   ')
    expect(result.error).toBe('메시지를 입력해 주세요')
  })

  it('보낸 메시지가 대화방에 쌓인다', () => {
    setCurrentUserId('u4')
    const before = getConversationMessages('c1').length
    sendMessage('c1', '테스트 메시지')
    expect(getConversationMessages('c1').length).toBe(before + 1)
  })
})

describe('pendingReceivedRequestCount — 신청함 배지용', () => {
  it('내가 받은 대기 중 신청 개수만 센다 (보낸 신청·수락된 신청은 빼고)', () => {
    setCurrentUserId('u2') // 시드에서 u1이 u2에게 대기 중 신청 1건을 보냈다
    expect(pendingReceivedRequestCount()).toBe(1)
  })

  it('로그인하지 않았으면 0이다', () => {
    setCurrentUserId(null)
    expect(pendingReceivedRequestCount()).toBe(0)
  })
})

describe('adminMetrics — 대화 이어진 관계 수는 양쪽 3턴 이상만 센다 (SPEC 8장)', () => {
  it('시드 데이터 기준으로 1건이다', () => {
    const store = getStore()
    store.profiles.find((p) => p.id === 'u1')!.is_admin = true
    const metrics = adminMetrics()
    expect(metrics.data?.대화이어진관계수).toBe(1)
  })
})
