import type { Profile, Tag } from '@/lib/types'
import { DEPARTMENTS } from '@/lib/departments'

/**
 * 시뮬레이션 초기 데이터.
 *
 * 예전 supabase/seed.sql과 같은 내용을 TypeScript 값으로 옮긴 것이다.
 * DB가 없으므로 이 파일이 "처음 상태"의 유일한 근거다.
 */

export const TAGS: Tag[] = [
  { id: 1, label: '운동·헬스' },
  { id: 2, label: '러닝' },
  { id: 3, label: '등산' },
  { id: 4, label: '게임' },
  { id: 5, label: '영화' },
  { id: 6, label: '음악' },
  { id: 7, label: '독서' },
  { id: 8, label: '카페' },
  { id: 9, label: '맛집' },
  { id: 10, label: '여행' },
  { id: 11, label: '사진' },
  { id: 12, label: '그림' },
  { id: 13, label: '요리' },
  { id: 14, label: '반려동물' },
  { id: 15, label: '공모전·대외활동' },
  { id: 16, label: '어학·교환학생' },
  { id: 17, label: '자격증·스터디' },
  { id: 18, label: '창업' },
  { id: 19, label: '코딩' },
  { id: 20, label: '보드게임' },
]

export const BALANCE_QUESTIONS: { id: number; optionA: string; optionB: string }[] = [
  { id: 1, optionA: '평생 여름만', optionB: '평생 겨울만' },
  { id: 2, optionA: '아침형 인간', optionB: '저녁형 인간' },
  { id: 3, optionA: '계획 세우고 여행', optionB: '무작정 떠나는 여행' },
  { id: 4, optionA: '산', optionB: '바다' },
  { id: 5, optionA: '치킨', optionB: '피자' },
  { id: 6, optionA: '민트초코 좋아함', optionB: '민트초코 싫어함' },
  { id: 7, optionA: '탕수육 부먹', optionB: '탕수육 찍먹' },
  { id: 8, optionA: '라면에 계란', optionB: '라면에 파' },
  { id: 9, optionA: '시험 전날 밤새기', optionB: '일찍 자고 새벽에 하기' },
  { id: 10, optionA: '조별과제 조장 하기', optionB: '조별과제 조원 하기' },
  { id: 11, optionA: '1교시 수업', optionB: '야간 수업' },
  { id: 12, optionA: '학식', optionB: '밖에서 사 먹기' },
  { id: 13, optionA: '공부는 도서관에서', optionB: '공부는 카페에서' },
  { id: 14, optionA: '벼락치기', optionB: '미리미리' },
  { id: 15, optionA: '국내 여행', optionB: '해외 여행' },
  { id: 16, optionA: '돈 많은 백수', optionB: '바쁘지만 좋아하는 일' },
  { id: 17, optionA: '과거로 가기', optionB: '미래로 가기' },
  { id: 18, optionA: '하늘 날기', optionB: '물속에서 숨쉬기' },
  { id: 19, optionA: '평생 한 가지 음식만', optionB: '평생 같은 옷만' },
  { id: 20, optionA: '유명해지기', optionB: '조용히 살기' },
  { id: 21, optionA: '강아지', optionB: '고양이' },
  { id: 22, optionA: '노래방에서 발라드', optionB: '노래방에서 신나는 곡' },
  { id: 23, optionA: '영화관 맨 앞줄', optionB: '영화관 맨 뒷줄' },
  { id: 24, optionA: '넷플릭스 정주행', optionB: '매주 한 편씩 보기' },
  { id: 25, optionA: '여행 갈 때 캐리어', optionB: '여행 갈 때 배낭' },
  { id: 26, optionA: '카톡 답장 즉시', optionB: '카톡 답장 몰아서' },
  { id: 27, optionA: '알람 한 번에 일어나기', optionB: '알람 다섯 번 미루기' },
  { id: 28, optionA: '매운 거', optionB: '단 거' },
  { id: 29, optionA: '아이스 아메리카노', optionB: '따뜻한 라떼' },
  { id: 30, optionA: '방 청소는 몰아서', optionB: '방 청소는 매일 조금씩' },
]

type SeedProfile = {
  id: string
  nickname: string
  birthYear: number
  department: string
  gender: 'male' | 'female'
  bio: string
  tagIds: number[]
}

const RAW_PROFILES: SeedProfile[] = [
  { id: 'u1', nickname: '민준', birthYear: 2002, department: DEPARTMENTS[0], gender: 'male', bio: '같이 헬스장 갈 사람 구해요', tagIds: [1, 9, 19] },
  { id: 'u2', nickname: '서연', birthYear: 2003, department: DEPARTMENTS[7], gender: 'female', bio: '카페 투어 같이 다녀요', tagIds: [8, 9, 11] },
  { id: 'u3', nickname: '도윤', birthYear: 2001, department: DEPARTMENTS[2], gender: 'male', bio: '주말에 등산 갈 사람!', tagIds: [3, 2, 9] },
  { id: 'u4', nickname: '하은', birthYear: 2004, department: DEPARTMENTS[12], gender: 'female', bio: '영화 얘기 하고 싶어요', tagIds: [5, 11, 7] },
  { id: 'u5', nickname: '시우', birthYear: 2000, department: DEPARTMENTS[1], gender: 'male', bio: '공모전 팀원 찾습니다', tagIds: [15, 19, 18] },
  { id: 'u6', nickname: '지아', birthYear: 2003, department: DEPARTMENTS[16], gender: 'female', bio: '교환학생 준비 같이 해요', tagIds: [16, 7, 10] },
  { id: 'u7', nickname: '예준', birthYear: 2002, department: DEPARTMENTS[8], gender: 'male', bio: '보드게임 좋아하면 연락 주세요', tagIds: [20, 4, 9] },
  { id: 'u8', nickname: '수아', birthYear: 2001, department: DEPARTMENTS[14], gender: 'female', bio: '독서모임 하실 분', tagIds: [7, 8, 6] },
  { id: 'u9', nickname: '주원', birthYear: 2004, department: DEPARTMENTS[4], gender: 'male', bio: '사진 찍으러 다녀요', tagIds: [11, 10, 5] },
  { id: 'u10', nickname: '지우', birthYear: 2002, department: DEPARTMENTS[17], gender: 'female', bio: '맛집 탐방 같이 갈 사람', tagIds: [9, 10, 8] },
  { id: 'u11', nickname: '건우', birthYear: 1999, department: DEPARTMENTS[3], gender: 'male', bio: '창업 준비 중입니다', tagIds: [18, 15, 17] },
  { id: 'u12', nickname: '유나', birthYear: 2003, department: DEPARTMENTS[15], gender: 'female', bio: '글쓰기 좋아해요', tagIds: [7, 12, 8] },
  { id: 'u13', nickname: '현우', birthYear: 2001, department: DEPARTMENTS[6], gender: 'male', bio: '러닝 크루 만들어요', tagIds: [2, 1, 13] },
  { id: 'u14', nickname: '소율', birthYear: 2004, department: DEPARTMENTS[13], gender: 'female', bio: '코딩 스터디 구해요', tagIds: [19, 17, 4] },
  { id: 'u15', nickname: '정우', birthYear: 2000, department: DEPARTMENTS[11], gender: 'male', bio: '자격증 같이 준비해요', tagIds: [17, 7, 1] },
  { id: 'u16', nickname: '나윤', birthYear: 2002, department: DEPARTMENTS[18], gender: 'female', bio: '반려견 산책 메이트 찾아요', tagIds: [14, 2, 8] },
  { id: 'u17', nickname: '민재', birthYear: 2003, department: DEPARTMENTS[10], gender: 'male', bio: '음악 페스티벌 같이 가요', tagIds: [6, 10, 5] },
  { id: 'u18', nickname: '채원', birthYear: 2001, department: DEPARTMENTS[9], gender: 'female', bio: '요리 배우고 있어요', tagIds: [13, 9, 14] },
  { id: 'u19', nickname: '준호', birthYear: 2004, department: DEPARTMENTS[5], gender: 'male', bio: '게임 같이 하실 분', tagIds: [4, 20, 19] },
  { id: 'u20', nickname: '다인', birthYear: 2002, department: DEPARTMENTS[19], gender: 'female', bio: '같이 운동할 사람 구해요', tagIds: [1, 2, 3] },
]

export function seedProfiles(): Profile[] {
  const now = new Date()
  return RAW_PROFILES.map((p, i) => ({
    id: p.id,
    nickname: p.nickname,
    birth_year: p.birthYear,
    department: p.department,
    gender: p.gender,
    bio: p.bio,
    photo_url: null,
    is_admin: false,
    suspended_until: null,
    suspend_reason: null,
    created_at: now.toISOString(),
    last_seen_at: new Date(now.getTime() - i * 3600_000).toISOString(),
  }))
}

export function seedProfileTags(): { profile_id: string; tag_id: number }[] {
  return RAW_PROFILES.flatMap((p) => p.tagIds.map((tag_id) => ({ profile_id: p.id, tag_id })))
}

/**
 * 친구 신청 6건(대기 5 + 수락 1)과 대화방 1개(메시지 6개, 양쪽 3턴씩).
 * 양쪽 3턴으로 만든 이유는 SPEC 8장 주지표("대화 이어진 관계 수")가
 * 처음부터 0이 아니라 1로 보이게 하기 위해서다.
 */
export function seedFriendRequests() {
  const pending = [
    { sender: 'u1', receiver: 'u2', greeting: '안녕하세요! 카페 투어 같이 다니고 싶어서 연락드려요' },
    { sender: 'u3', receiver: 'u20', greeting: '등산 좋아하신다면 주말에 같이 가실래요?' },
    { sender: 'u5', receiver: 'u14', greeting: '공모전 팀원 구하는데 통계 쪽 관심 있으신가요?' },
    { sender: 'u7', receiver: 'u15', greeting: '보드게임 모임 하는데 혹시 관심 있으세요?' },
    { sender: 'u13', receiver: 'u16', greeting: '아침 러닝 같이 하실 분 찾고 있어요!' },
  ].map((r, i) => ({
    id: `fr${i + 1}`,
    sender_id: r.sender,
    receiver_id: r.receiver,
    greeting: r.greeting,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    responded_at: null,
  }))

  const accepted = {
    id: 'fr6',
    sender_id: 'u4',
    receiver_id: 'u9',
    greeting: '사진 찍으러 다니신다길래 연락드려요!',
    status: 'accepted' as const,
    created_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
    responded_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
  }

  return [...pending, accepted]
}

export function seedConversations() {
  return [{ id: 'c1', user_a: 'u4', user_b: 'u9', created_at: new Date(Date.now() - 2 * 86400_000).toISOString() }]
}

export function seedMessages() {
  const base = Date.now() - 2 * 86400_000
  return [
    { id: 'm1', conversation_id: 'c1', sender_id: 'u4', body: '안녕하세요! 수락해 주셔서 감사해요', created_at: new Date(base).toISOString() },
    { id: 'm2', conversation_id: 'c1', sender_id: 'u9', body: '안녕하세요 :) 사진 자주 찍으세요?', created_at: new Date(base + 5 * 60_000).toISOString() },
    { id: 'm3', conversation_id: 'c1', sender_id: 'u4', body: '네 요즘 필름 카메라 배우는 중이에요', created_at: new Date(base + 9 * 60_000).toISOString() },
    { id: 'm4', conversation_id: 'c1', sender_id: 'u9', body: '오 저도 필름 써봤는데 현상비가 만만찮더라고요', created_at: new Date(base + 86400_000).toISOString() },
    { id: 'm5', conversation_id: 'c1', sender_id: 'u4', body: '맞아요 ㅋㅋ 그래도 결과물 보면 기분 좋아요', created_at: new Date(base + 86400_000 + 3 * 60_000).toISOString() },
    { id: 'm6', conversation_id: 'c1', sender_id: 'u9', body: '이번 주말에 시간 되면 같이 출사 가실래요?', created_at: new Date(base + 2 * 86400_000 - 3 * 3600_000).toISOString() },
  ]
}
