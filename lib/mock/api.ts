import type { Gender, Metrics, ProfileCard, ReportQueueRow, ReportReason } from '@/lib/types'
import { getCurrentUserId, getStore, persist, randomId, type Store } from './store'
import { TAGS } from './seed'

/**
 * 예전 supabase/migrations/003_functions.sql 의 RPC 11개를 그대로
 * TypeScript 함수로 옮긴 것이다. 하루 신청 상한 5건, 차단 양방향,
 * 신고 3명 임계치, 자동 정지 없음 — 업무 규칙은 전부 여기에만 있다.
 * 화면 코드는 이 함수들만 호출한다.
 */

type Result<T> = { data: T; error: null } | { data: null; error: string }
const ok = <T>(data: T): Result<T> => ({ data, error: null })
const fail = <T>(error: string): Result<T> => ({ data: null, error })

function requireUser(): string | null {
  return getCurrentUserId()
}

function isBlockedEitherWay(store: Store, a: string, b: string) {
  return store.blocks.some(
    (x) => (x.blocker_id === a && x.blocked_id === b) || (x.blocker_id === b && x.blocked_id === a),
  )
}

function isSuspendedNow(store: Store, userId: string) {
  const p = store.profiles.find((x) => x.id === userId)
  return Boolean(p?.suspended_until && new Date(p.suspended_until).getTime() > Date.now())
}

// ---------------------------------------------------------------
// 검색 (SPEC 4.3) — 태그는 OR, 성별 기본값은 "상관없음"
// ---------------------------------------------------------------
export type SearchFilters = {
  gender?: Gender | null
  minAge?: number
  maxAge?: number
  department?: string | null
  tagIds?: number[]
}

export function searchProfiles(filters: SearchFilters = {}): ProfileCard[] {
  const me = requireUser()
  const store = getStore()
  const currentYear = new Date().getFullYear()
  const minAge = filters.minAge ?? 19
  const maxAge = filters.maxAge ?? 30
  const tagIds = filters.tagIds ?? []

  return store.profiles
    .filter((p) => p.id !== me)
    .filter((p) => !isSuspendedNow(store, p.id))
    .filter((p) => !me || !isBlockedEitherWay(store, me, p.id))
    .filter((p) => !filters.gender || p.gender === filters.gender)
    .filter((p) => {
      const age = currentYear - p.birth_year
      return age >= minAge && age <= maxAge
    })
    .filter((p) => !filters.department || p.department === filters.department)
    .filter((p) => {
      if (tagIds.length === 0) return true
      const mine = store.profileTags.filter((t) => t.profile_id === p.id).map((t) => t.tag_id)
      return tagIds.some((id) => mine.includes(id))
    })
    .sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
    .map((p) => ({
      id: p.id,
      nickname: p.nickname,
      birth_year: p.birth_year,
      department: p.department,
      gender: p.gender,
      bio: p.bio,
      photo_url: p.photo_url,
      tag_labels: store.profileTags
        .filter((t) => t.profile_id === p.id)
        .map((t) => TAGS.find((tag) => tag.id === t.tag_id)?.label)
        .filter((label): label is string => Boolean(label)),
    }))
}

// ---------------------------------------------------------------
// 친구 신청 (SPEC 4.4 — 하루 5건)
// ---------------------------------------------------------------
const DAILY_REQUEST_LIMIT = 5

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function remainingRequestsToday(): number {
  const me = requireUser()
  if (!me) return DAILY_REQUEST_LIMIT
  const store = getStore()
  const sentToday = store.friendRequests.filter(
    (r) => r.sender_id === me && new Date(r.created_at).getTime() >= startOfToday(),
  ).length
  return Math.max(0, DAILY_REQUEST_LIMIT - sentToday)
}

export function sendFriendRequest(receiverId: string, greeting: string): Result<string> {
  const me = requireUser()
  if (!me) return fail('로그인이 필요합니다')
  if (me === receiverId) return fail('자기 자신에게는 신청할 수 없습니다')

  const value = greeting.trim()
  if (value.length < 1) return fail('인사말을 입력해 주세요')
  if (value.length > 200) return fail('인사말은 200자까지 쓸 수 있습니다')

  const store = getStore()
  if (isSuspendedNow(store, me)) return fail('정지 중에는 신청할 수 없습니다')
  if (isBlockedEitherWay(store, me, receiverId)) return fail('신청할 수 없는 상대입니다')
  if (store.friendRequests.some((r) => r.sender_id === me && r.receiver_id === receiverId)) {
    return fail('이미 신청한 상대입니다')
  }
  if (remainingRequestsToday() <= 0) return fail('하루에 보낼 수 있는 신청은 5건입니다')

  const id = randomId('fr')
  store.friendRequests.push({
    id,
    sender_id: me,
    receiver_id: receiverId,
    greeting: value,
    status: 'pending',
    created_at: new Date().toISOString(),
    responded_at: null,
  })
  persist(store)
  return ok(id)
}

/** 수락이면 대화방 id, 거절이면 null. 거절 사실은 신청자 화면에서 무응답과 구별하지 않는다 (SPEC 4.4) */
export function respondFriendRequest(requestId: string, accept: boolean): Result<string | null> {
  const me = requireUser()
  if (!me) return fail('로그인이 필요합니다')

  const store = getStore()
  const request = store.friendRequests.find(
    (r) => r.id === requestId && r.receiver_id === me && r.status === 'pending',
  )
  if (!request) return fail('처리할 수 없는 신청입니다')

  request.status = accept ? 'accepted' : 'rejected'
  request.responded_at = new Date().toISOString()

  if (!accept) {
    persist(store)
    return ok(null)
  }

  const [a, b] = [me, request.sender_id].sort()
  let conv = store.conversations.find((c) => c.user_a === a && c.user_b === b)
  if (!conv) {
    conv = { id: randomId('c'), user_a: a, user_b: b, created_at: new Date().toISOString() }
    store.conversations.push(conv)
  }
  persist(store)
  return ok(conv.id)
}

/** 내가 고른 관심사 태그 id 목록. 내 프로필 편집 화면에서 초기값으로 쓴다 */
export function myTagIds(): number[] {
  const me = requireUser()
  if (!me) return []
  return getStore()
    .profileTags.filter((t) => t.profile_id === me)
    .map((t) => t.tag_id)
}

// ---------------------------------------------------------------
// 차단 (SPEC 4.5 — 제재 아님, 양방향, 상대는 모른다)
// ---------------------------------------------------------------
export function blockUser(targetId: string): Result<null> {
  const me = requireUser()
  if (!me || me === targetId) return fail('차단할 수 없습니다')
  const store = getStore()
  if (!store.blocks.some((b) => b.blocker_id === me && b.blocked_id === targetId)) {
    store.blocks.push({ blocker_id: me, blocked_id: targetId, created_at: new Date().toISOString() })
    persist(store)
  }
  return ok(null)
}

export function unblockUser(targetId: string): Result<null> {
  const me = requireUser()
  if (!me) return fail('로그인이 필요합니다')
  const store = getStore()
  store.blocks = store.blocks.filter((b) => !(b.blocker_id === me && b.blocked_id === targetId))
  persist(store)
  return ok(null)
}

export function myBlockedList(): string[] {
  const me = requireUser()
  if (!me) return []
  return getStore()
    .blocks.filter((b) => b.blocker_id === me)
    .map((b) => b.blocked_id)
}

/** 숨긴 사람 목록 화면에 쓴다. 정지 여부와 무관하게 내가 차단한 사람은 전부 보여준다 */
export function myBlockedProfiles(): ProfileCard[] {
  const store = getStore()
  return myBlockedList()
    .map((id) => store.profiles.find((p) => p.id === id))
    .filter((p): p is (typeof store.profiles)[number] => Boolean(p))
    .map((p) => ({
      id: p.id,
      nickname: p.nickname,
      birth_year: p.birth_year,
      department: p.department,
      gender: p.gender,
      bio: p.bio,
      photo_url: p.photo_url,
      tag_labels: store.profileTags
        .filter((t) => t.profile_id === p.id)
        .map((t) => TAGS.find((tag) => tag.id === t.tag_id)?.label)
        .filter((label): label is string => Boolean(label)),
    }))
}

// ---------------------------------------------------------------
// 신고 (SPEC 4.5 — 신고 시 자동 상호 차단, 3명 이상이면 검토 대기,
// 정지는 관리자만. 신고 누적으로 자동 정지하지 않는다)
// ---------------------------------------------------------------
const REPORT_THRESHOLD = 3

export function reportUser(targetId: string, reason: ReportReason, detail?: string): Result<string> {
  const me = requireUser()
  if (!me || me === targetId) return fail('신고할 수 없습니다')

  const store = getStore()
  if (store.reports.some((r) => r.reporter_id === me && r.reported_id === targetId)) {
    return fail('이미 신고한 상대입니다')
  }

  const id = randomId('rp')
  store.reports.push({
    id,
    reporter_id: me,
    reported_id: targetId,
    reason,
    detail: detail ?? null,
    status: 'pending',
    created_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
  })

  if (!store.blocks.some((b) => b.blocker_id === me && b.blocked_id === targetId)) {
    store.blocks.push({ blocker_id: me, blocked_id: targetId, created_at: new Date().toISOString() })
  }
  if (!store.blocks.some((b) => b.blocker_id === targetId && b.blocked_id === me)) {
    store.blocks.push({ blocker_id: targetId, blocked_id: me, created_at: new Date().toISOString() })
  }

  persist(store)
  return ok(id)
}

// ---------------------------------------------------------------
// 채팅 (SPEC 4.4 — 텍스트만, 사진·파일·삭제·수정 없음)
// ---------------------------------------------------------------
export type ConversationSummary = {
  conversationId: string
  peer: ProfileCard
  lastMessage: string | null
  lastMessageAt: string | null
  unread: number
}

/** 내 대화방 목록. 상대 프로필·마지막 메시지·안 읽은 개수를 함께 계산해 준다 */
export function getMyConversations(): ConversationSummary[] {
  const me = requireUser()
  if (!me) return []
  const store = getStore()

  return store.conversations
    .filter((c) => c.user_a === me || c.user_b === me)
    .map((c) => {
      const peerId = c.user_a === me ? c.user_b : c.user_a
      const peerProfile = store.profiles.find((p) => p.id === peerId)!
      const msgs = store.messages
        .filter((m) => m.conversation_id === c.id)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      const last = msgs[0]

      return {
        conversationId: c.id,
        peer: {
          id: peerProfile.id,
          nickname: peerProfile.nickname,
          birth_year: peerProfile.birth_year,
          department: peerProfile.department,
          gender: peerProfile.gender,
          bio: peerProfile.bio,
          photo_url: peerProfile.photo_url,
          tag_labels: store.profileTags
            .filter((t) => t.profile_id === peerId)
            .map((t) => TAGS.find((tag) => tag.id === t.tag_id)?.label)
            .filter((l): l is string => Boolean(l)),
        },
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.created_at ?? null,
        unread: unreadCount(c.id),
      }
    })
    .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''))
}

function requireParticipant(store: Store, conversationId: string, me: string) {
  const conv = store.conversations.find((c) => c.id === conversationId)
  return conv && (conv.user_a === me || conv.user_b === me) ? conv : null
}

export function getConversationMessages(conversationId: string) {
  const me = requireUser()
  const store = getStore()
  if (!me || !requireParticipant(store, conversationId, me)) return []
  return store.messages
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
}

export function sendMessage(conversationId: string, body: string): Result<string> {
  const me = requireUser()
  if (!me) return fail('로그인이 필요합니다')

  const store = getStore()
  if (!requireParticipant(store, conversationId, me)) return fail('접근할 수 없는 대화방입니다')

  const value = body.trim()
  if (value.length < 1) return fail('메시지를 입력해 주세요')
  if (value.length > 1000) return fail('메시지는 1000자까지 쓸 수 있습니다')

  const id = randomId('m')
  store.messages.push({
    id,
    conversation_id: conversationId,
    sender_id: me,
    body: value,
    created_at: new Date().toISOString(),
  })
  persist(store)
  return ok(id)
}

// ---------------------------------------------------------------
// 읽음 처리 — 내가 어디까지 읽었는지만 저장한다 (상대에게 노출 안 함)
// ---------------------------------------------------------------
export function markConversationRead(conversationId: string): Result<null> {
  const me = requireUser()
  if (!me) return fail('로그인이 필요합니다')
  const store = getStore()
  const conv = store.conversations.find((c) => c.id === conversationId)
  if (!conv || (conv.user_a !== me && conv.user_b !== me)) return fail('접근할 수 없는 대화방입니다')

  const existing = store.conversationReads.find((r) => r.conversation_id === conversationId && r.user_id === me)
  if (existing) existing.last_read_at = new Date().toISOString()
  else store.conversationReads.push({ conversation_id: conversationId, user_id: me, last_read_at: new Date().toISOString() })
  persist(store)
  return ok(null)
}

export function unreadCount(conversationId: string): number {
  const me = requireUser()
  if (!me) return 0
  const store = getStore()
  const lastRead = store.conversationReads.find((r) => r.conversation_id === conversationId && r.user_id === me)
    ?.last_read_at
  return store.messages.filter(
    (m) => m.conversation_id === conversationId && m.sender_id !== me && (!lastRead || m.created_at > lastRead),
  ).length
}

// ---------------------------------------------------------------
// 관리자 (SPEC 4.5·8장) — 검토 대기 중에도 노출 유지, 자동 정지 없음
// ---------------------------------------------------------------
function requireAdmin(store: Store): string | null {
  const me = requireUser()
  const profile = me ? store.profiles.find((p) => p.id === me) : null
  return profile?.is_admin ? me : null
}

export function adminReportQueue(): Result<ReportQueueRow[]> {
  const store = getStore()
  if (!requireAdmin(store)) return fail('관리자만 볼 수 있습니다')

  const byTarget = new Map<string, typeof store.reports>()
  for (const r of store.reports) {
    byTarget.set(r.reported_id, [...(byTarget.get(r.reported_id) ?? []), r])
  }

  const rows: ReportQueueRow[] = []
  for (const [reportedId, reports] of byTarget) {
    const reporterCount = new Set(reports.map((r) => r.reporter_id)).size
    if (reporterCount < REPORT_THRESHOLD) continue
    const profile = store.profiles.find((p) => p.id === reportedId)
    if (!profile) continue
    rows.push({
      reported_id: reportedId,
      nickname: profile.nickname,
      department: profile.department,
      reporter_count: reporterCount,
      pending_count: reports.filter((r) => r.status === 'pending').length,
      latest_at: reports.reduce((a, b) => (a > b.created_at ? a : b.created_at), reports[0].created_at),
      reasons: [...new Set(reports.map((r) => r.reason))],
      suspended_until: profile.suspended_until,
    })
  }
  rows.sort((a, b) => b.reporter_count - a.reporter_count || (a.latest_at < b.latest_at ? 1 : -1))
  return ok(rows)
}

export function adminResolveReport(
  reportedId: string,
  action: 'dismissed' | 'warned' | 'suspended',
  days = 30,
): Result<null> {
  const store = getStore()
  const admin = requireAdmin(store)
  if (!admin) return fail('관리자만 처리할 수 있습니다')
  if (action === 'suspended' && (!Number.isFinite(days) || days < 1 || days > 365)) {
    return fail('정지 기간은 1일에서 365일 사이여야 합니다')
  }

  for (const r of store.reports) {
    if (r.reported_id === reportedId && r.status === 'pending') {
      r.status = action
      r.reviewed_at = new Date().toISOString()
      r.reviewed_by = admin
    }
  }

  if (action === 'suspended') {
    const profile = store.profiles.find((p) => p.id === reportedId)
    if (profile) {
      profile.suspended_until = new Date(Date.now() + days * 86400_000).toISOString()
      profile.suspend_reason = '신고가 누적되어 관리자 검토 후 이용이 제한되었습니다'
    }
  }

  persist(store)
  return ok(null)
}

export function adminMetrics(): Result<Metrics> {
  const store = getStore()
  if (!requireAdmin(store)) return fail('관리자만 볼 수 있습니다')

  const turnsByConv = new Map<string, Map<string, number>>()
  for (const m of store.messages) {
    const bySender = turnsByConv.get(m.conversation_id) ?? new Map<string, number>()
    bySender.set(m.sender_id, (bySender.get(m.sender_id) ?? 0) + 1)
    turnsByConv.set(m.conversation_id, bySender)
  }
  let activeConversations = 0
  for (const bySender of turnsByConv.values()) {
    const counts = [...bySender.values()]
    if (counts.length === 2 && counts.every((n) => n >= 3)) activeConversations += 1
  }

  const accepted = store.friendRequests.filter((r) => r.status === 'accepted').length
  const total = store.friendRequests.length

  return ok({
    가입자수: store.profiles.length,
    신청건수: total,
    수락건수: accepted,
    대화방수: store.conversations.length,
    대화이어진관계수: activeConversations,
    수락률: total === 0 ? null : Math.round((accepted / total) * 1000) / 10,
  })
}
