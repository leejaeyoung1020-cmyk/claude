// 시뮬레이션 데이터 모델의 타입.
// lib/mock/store.ts가 이 형태로 localStorage에 저장한다.
// 이 파일은 A만 수정한다 (팀 규칙).

export type Gender = 'male' | 'female'

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export type ReportReason =
  | 'abuse'          // 욕설·비하
  | 'sexual'         // 성적 불쾌감
  | 'spam'           // 사기·홍보
  | 'pressure'       // 만남 강요
  | 'impersonation'  // 프로필 사칭
  | 'other'          // 기타

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  abuse: '욕설·비하',
  sexual: '성적 불쾌감',
  spam: '사기·홍보',
  pressure: '만남 강요',
  impersonation: '프로필 사칭',
  other: '기타',
}

export type ReportStatus = 'pending' | 'dismissed' | 'warned' | 'suspended'

export type Profile = {
  id: string
  /** 로그인 조회용. 화면에는 절대 표시하지 않는다 (SPEC 4.2 — 이메일은 비공개) */
  email?: string
  nickname: string
  birth_year: number
  department: string
  gender: Gender
  bio: string
  photo_url: string | null
  is_admin: boolean
  suspended_until: string | null
  suspend_reason: string | null
  created_at: string
  last_seen_at: string
}

export type Tag = {
  id: number
  label: string
}

/** search_profiles() 가 돌려주는 검색 결과 한 줄 */
export type ProfileCard = {
  id: string
  nickname: string
  birth_year: number
  department: string
  gender: Gender
  bio: string
  photo_url: string | null
  tag_labels: string[]
}

export type FriendRequest = {
  id: string
  sender_id: string
  receiver_id: string
  greeting: string
  status: FriendRequestStatus
  created_at: string
  responded_at: string | null
}

export type Conversation = {
  id: string
  user_a: string
  user_b: string
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export type Report = {
  id: string
  reporter_id: string
  reported_id: string
  reason: ReportReason
  detail: string | null
  status: ReportStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

/** admin_report_queue() 한 줄 */
export type ReportQueueRow = {
  reported_id: string
  nickname: string
  department: string
  reporter_count: number
  pending_count: number
  latest_at: string
  reasons: ReportReason[]
  suspended_until: string | null
}

/** admin_metrics() 한 줄 (SPEC 8장) */
export type Metrics = {
  가입자수: number
  신청건수: number
  수락건수: number
  대화방수: number
  대화이어진관계수: number
  수락률: number | null
}
