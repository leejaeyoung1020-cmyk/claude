import type { Conversation, FriendRequest, Message, Profile, Report } from '@/lib/types'
import {
  seedConversations,
  seedFriendRequests,
  seedMessages,
  seedProfileTags,
  seedProfiles,
} from './seed'

/**
 * Supabase 없이 브라우저 localStorage로 돌아가는 시뮬레이션 저장소.
 *
 * 서버가 없으므로 "행 수준 보안(RLS)" 개념은 없다. 대신 이 파일의
 * 함수들이 조회 시점에 필터링해서 같은 효과를 낸다(예: 차단한 상대를
 * 검색 결과에서 뺀다). 업무 규칙은 이 파일이 아니라 api.ts 에 있다 —
 * 여기는 순수하게 데이터를 읽고 쓰는 저장소 역할만 한다.
 *
 * 브라우저에서만 동작한다. 서버 렌더링 중에는 빈 시드로 응답하므로,
 * 데이터를 쓰는 화면은 반드시 클라이언트 컴포넌트여야 하고
 * useEffect 안에서 store 함수를 호출해야 한다.
 */

export const STORAGE_KEY = 'friend-app-sim-v1'
const CURRENT_USER_KEY = 'friend-app-sim-current-user'

export type Block = { blocker_id: string; blocked_id: string; created_at: string }
export type ConversationRead = { conversation_id: string; user_id: string; last_read_at: string }

export type Store = {
  profiles: Profile[]
  profileTags: { profile_id: string; tag_id: number }[]
  friendRequests: FriendRequest[]
  conversations: Conversation[]
  messages: Message[]
  conversationReads: ConversationRead[]
  blocks: Block[]
  reports: Report[]
}

function freshStore(): Store {
  return {
    profiles: seedProfiles(),
    profileTags: seedProfileTags(),
    friendRequests: seedFriendRequests(),
    conversations: seedConversations(),
    messages: seedMessages(),
    conversationReads: [],
    blocks: [],
    reports: [],
  }
}

let cache: Store | null = null

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getStore(): Store {
  if (cache) return cache
  if (!isBrowser()) return freshStore()

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    cache = freshStore()
    persist(cache)
    return cache
  }
  try {
    cache = JSON.parse(raw) as Store
  } catch {
    cache = freshStore()
    persist(cache)
  }
  return cache
}

/**
 * 다른 탭이 localStorage를 바꾼 뒤(storage 이벤트) 부른다. getStore()는
 * 메모리 캐시를 우선 돌려주므로, 이 함수 없이는 이 탭이 자기 자신의
 * persist()로 쓰지 않은 변경은 영영 반영되지 않는다.
 *
 * 화면마다 이 함수를 일일이 불러야 한다면, 리스너를 깜빡 빠뜨린 화면은
 * 계속 예전 캐시를 보여준다 (예: 신청함 화면이 다른 탭에서 받은 신청을
 * 못 보던 문제). 그래서 아래에서 storage 이벤트를 이 파일이 직접
 * 구독해, 어떤 화면이 부르든 다음 getStore()가 항상 최신값을 돌려주게
 * 만든다 — 화면들은 신경 쓸 필요가 없다.
 */
export function reloadFromStorage() {
  cache = null
}

if (isBrowser()) {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) reloadFromStorage()
  })
}

export function persist(store: Store) {
  cache = store
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/** 데이터를 처음 상태로 되돌린다. 발표 리허설 사이에 초기화할 때 쓴다. */
export function resetStore() {
  cache = freshStore()
  persist(cache)
  if (isBrowser()) window.sessionStorage.removeItem(CURRENT_USER_KEY)
}

/**
 * "지금 로그인한 사람"은 일부러 localStorage가 아니라 sessionStorage에 둔다.
 *
 * sessionStorage는 탭마다 따로 있고, localStorage는 같은 브라우저의
 * 모든 탭이 공유한다. 로그인 정보까지 localStorage에 두면 탭 두 개를
 * 열어도 항상 같은 계정으로 보여서, 친구 신청·채팅을 양쪽에서
 * 동시에 테스트할 수 없다. sessionStorage 덕분에 탭마다 다른 계정으로
 * 로그인하면서도, 실제 데이터(profiles·messages 등)는 localStorage에
 * 있어 한쪽 탭에서 메시지를 보내면 다른 탭에 storage 이벤트로 곧장 반영된다.
 */
export function getCurrentUserId(): string | null {
  if (!isBrowser()) return null
  return window.sessionStorage.getItem(CURRENT_USER_KEY)
}

export function setCurrentUserId(id: string | null) {
  if (!isBrowser()) return
  if (id) window.sessionStorage.setItem(CURRENT_USER_KEY, id)
  else window.sessionStorage.removeItem(CURRENT_USER_KEY)
}

function randomId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
export { randomId }
