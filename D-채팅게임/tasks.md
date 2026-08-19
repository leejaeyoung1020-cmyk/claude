# D — 채팅 · 밸런스게임

**맡는 것:** 대화방 목록, 1:1 실시간 채팅, 안 읽은 메시지 표시, 대면 밸런스게임
**담당 Phase:** 5 · 8
**주로 건드리는 파일:** `app/chat/page.tsx`, `app/chat/[id]/page.tsx`, `app/chat/[id]/meet/page.tsx`, `components/MessageBubble.tsx`

참고 문서: [../plan.md](../plan.md) · [../SPEC.md](../SPEC.md) · [../tasks.md](../tasks.md)

---

## 시작 전에 알아야 할 것

**서버가 없다 (2026-08-19 결정).** `app/actions/chat.ts` 서버 액션은 만들지 않는다. 채팅에 필요한 함수(`getMyConversations`·`getConversationMessages`·`sendMessage`·`markConversationRead`·`unreadCount`)는 **A가 이미 `lib/mock/api.ts`에 만들어 뒀다.** 화면에서 이 함수들을 직접 부른다.

**시작 조건:** A의 Phase 0 코드(`lib/mock/**`)가 `main`에 있으면 바로 시작한다. **시드 데이터에 수락된 대화방 1개(`c1`, `u4`↔`u9`)와 메시지 6개가 들어 있으므로**, C의 친구 신청 기능이 완성되기를 기다리지 않고 바로 채팅 화면을 만들 수 있다. `tests/mockApi.test.ts`에 `setCurrentUserId('u4')` 후 이 대화방을 다루는 테스트가 있으니 참고한다.

**"실시간"은 서버 없이 `storage` 이벤트로 흉내 낸다.** 이게 이 프로젝트에서 기술적으로 가장 까다로운 부분이다. 핵심 원리:

- 로그인 정보는 `sessionStorage`(탭마다 독립), 실제 데이터는 `localStorage`(같은 브라우저의 모든 탭이 공유)에 있다
- 그래서 **같은 브라우저에서 탭을 두 개 열어 각각 다른 계정으로 로그인**하면, 한쪽 탭에서 메시지를 보내 `localStorage`를 바꾸면 다른 탭에 브라우저가 자동으로 `window`의 `storage` 이벤트를 쏴 준다
- **시크릿 창이나 다른 브라우저는 이 이벤트가 오지 않는다** (완전히 분리된 저장소이기 때문). 그 경우는 새로고침해야 상대 메시지가 보인다 — 버그가 아니라 이 구조의 한계다. 개발·시연 모두 **같은 브라우저의 탭 두 개**로 한다

**막히면 가장 먼저 의심할 것**

메시지가 다른 탭에 안 뜨면: (1) 정말 다른 탭에서 보냈는지(같은 탭이면 이벤트가 안 온다 — `state`로 바로 반영되니 그건 정상), (2) `addEventListener('storage', ...)`의 `e.key`가 `'friend-app-sim-v1'`인지 확인했는지, (3) 컴포넌트 언마운트 시 리스너를 해제하다가 실수로 마운트 시점 리스너까지 같이 못 붙인 건 아닌지 순서로 의심한다.

**내가 남에게서 받는 것**

| 받는 것 | 준 사람 | 없으면 |
|---|---|---|
| `lib/mock/**` (채팅 함수 포함) · 시드 대화방 1개 | A (Phase 0) | 시작 불가 |
| `components/Avatar.tsx` | B (Phase 2-3) | 임시 원형 표시로 대체 후 교체 |
| 수락 → 대화방 생성 흐름 | C (Phase 4) | 시드 대화방으로 개발하고, 나중에 실제 흐름으로 재확인 |

**내가 남에게 넘기는 것**

| 넘기는 것 | 받는 사람 | 언제 |
|---|---|---|
| `app/chat/[id]/page.tsx` | B (여기에 신고 진입점을 붙인다) | Phase 5 끝 |

---

## Phase 5 — 1:1 채팅

**끝나면 보이는 것:** 같은 브라우저에서 탭 두 개(계정 2개)를 나란히 띄우고 한쪽에서 메시지를 보내면 다른 쪽에 새로고침 없이 즉시 뜬다.

🔍 = 눈으로 확인 / 💾 = 커밋 지점

### 5-1 대화방 목록

- [x] `app/chat/page.tsx`(`'use client'`) — `lib/mock/api.ts`의 `getMyConversations()`로 내 대화방 목록 조회
- [x] 각 행: 아바타 · 상대 닉네임 · 마지막 메시지 미리보기 · 마지막 시각 · 안 읽은 개수 배지 (전부 `getMyConversations()`가 계산해서 준다)
- [x] 대화방이 없을 때 "아직 대화가 없어요. 검색에서 친구를 찾아보세요" + 검색 이동 버튼
- [x] 🔍 `u4` 계정으로 로그인 → 시드 데이터의 대화방(`c1`, 상대 `u9`)이 목록에 보인다
- [x] 💾 `feat: 대화방 목록`

### 5-2 대화방

- [x] `components/MessageBubble.tsx` — 내 메시지 오른쪽·상대 왼쪽, 시각 표시
- [x] `app/chat/[id]/page.tsx`(`'use client'`) — `getConversationMessages(id)`로 기존 메시지 불러오기 (오래된 것부터, 아래가 최신)
- [x] 내 대화방이 아니면 접근 차단 — `getConversationMessages()`는 참여자가 아니면 빈 배열을 주므로, 빈 배열이면 "접근할 수 없어요" 화면을 보여준다
- [x] 하단 입력창 + 전송 버튼, Enter로도 전송
- [x] `lib/mock/api.ts`의 `sendMessage(conversationId, body)`를 직접 부른다 — 빈 문자열·공백만 있는 메시지는 함수 안에서 이미 거부한다
- [x] 전송 후 스크롤을 맨 아래로 이동
- [x] 🔍 메시지를 보내면 화면에 뜨고, 새로고침해도 남아 있다
- [x] 🔍 빈 메시지는 전송되지 않는다
- [x] 🔍 내 대화방이 아닌 id를 주소창에 직접 입력 → 접근이 막힌다
- [x] 💾 `feat: 대화방 · 메시지 전송`

### 5-3 "실시간" — `storage` 이벤트

```ts
// app/chat/[id]/page.tsx
useEffect(() => {
  function onStorage(e: StorageEvent) {
    if (e.key !== 'friend-app-sim-v1') return
    setMessages(getConversationMessages(conversationId))
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}, [conversationId])
```

- [x] 위 리스너 추가 (`localStorage` 키 이름은 `lib/mock/store.ts`의 `STORAGE_KEY`와 반드시 같아야 한다)
- [x] 컴포넌트 언마운트 시 리스너 해제 (위 코드의 `return () => ...`)
- [x] 🔍 같은 브라우저에서 탭 두 개를 열고 각각 다른 계정(예: `u4`, `u9`)으로 로그인 → 한쪽에서 전송 → 다른 쪽에 **새로고침 없이** 즉시 표시
- [x] 🔍 안 뜨면: 정말 다른 탭인지, `e.key` 비교가 맞는지, 리스너가 붙어 있는지 순서로 의심한다
- [x] 🔍 시크릿 창으로 시도하면 반영이 안 되는 것을 확인한다 (분리된 저장소라 당연한 현상 — 새로고침하면 보인다)
- [x] 💾 `feat: storage 이벤트로 실시간 메시지 반영`

### 5-4 읽음 처리

- [x] 대화방 진입 시 `lib/mock/api.ts`의 `markConversationRead(conversationId)` 호출
- [x] 🔍 방에 들어가면 목록의 안 읽은 배지가 사라진다
- [x] 🔍 **상대에게 내가 읽었다는 표시가 안 보인다** (SPEC 4.4 제외 항목)
- [x] B에게 알림 — `app/chat/[id]/page.tsx` 완성, 신고 진입점 붙여도 됨
- [x] 💾 `feat: 안 읽은 메시지 표시`

---

## Phase 8 — 대면 밸런스게임

**끝나면 보이는 것:** 대화방에서 "만났어요"를 누르면 큰 글씨 질문이 뜨고, 넘기기로 계속 다음 질문을 본다. 답을 입력하는 곳이 없다.

**이 화면은 폰을 책상에 놓고 두 사람이 함께 보는 화면이다.** 혼자 보는 화면이 아니므로 글씨 크기와 세로 배치가 전부다.

- [x] `app/chat/[id]/page.tsx` 상단에 "만났어요" 버튼 추가 → `/chat/[id]/meet`
- [x] `app/chat/[id]/meet/page.tsx`(`'use client'`) — `lib/mock/seed.ts`의 `BALANCE_QUESTIONS` 상수를 그대로 쓴다 (서버 조회 없음)
- [x] 불러온 순서를 무작위로 섞고 인덱스로 하나씩 보여준다
- [x] 질문을 화면 전체에 크게 (선택지 A / "vs" / 선택지 B, 최소 32px)
- [x] 세로 화면 기준 레이아웃
- [x] 버튼은 "다음 질문" 하나만 만든다
- [x] 30개를 다 보면 "질문을 다 봤어요" + "처음부터 다시" 버튼
- [x] 나가기 버튼으로 대화방 복귀
- [x] 🔍 대화방에서 "만났어요" → 질문 화면으로 넘어간다
- [x] 🔍 **폰을 책상에 놓고 팔 하나 거리에서 글씨가 읽힌다** (실제로 해본다)
- [x] 🔍 "다음 질문"을 30번 눌러도 같은 질문이 두 번 안 나온다
- [x] 🔍 답을 입력하거나 고르는 UI가 화면 어디에도 없다 (SPEC 4.6)
- [x] 🔍 화면을 나갔다 다시 들어와도 개발자 도구의 `localStorage`에 아무 데이터도 안 쌓인다
- [x] 💾 `feat: 대면 밸런스게임 화면`

---

## 절대 어기면 안 되는 것

- **밸런스게임 답을 저장하지 않는다.** 선택 버튼도, 입력창도, 서버 호출도 만들지 않는다. 말로 하는 것이 목적이고, 앱은 질문만 던지고 빠진다 (SPEC 4.6)
- **읽음 확인 표시를 만들지 않는다.** "안 읽은 개수"는 나에게만 보이는 내 정보이고, "상대가 읽었음"은 SPEC 제외 항목이다 (SPEC 4.4)
- **사진·파일·이모티콘 전송을 만들지 않는다.** v1은 텍스트만이다 (SPEC 4.4)
- **메시지 삭제·수정을 만들지 않는다** (SPEC 4.4)
- **내 대화방이 아닌 곳에 주소로 들어갈 수 없게 한다.** 화면에서 링크를 숨기는 것만으로는 부족하다 — `getConversationMessages()`·`sendMessage()`가 참여자인지 이미 확인해 주므로, 그 결과(빈 배열·오류)를 반드시 화면에서도 그대로 반영한다

---

Phase 8까지 끝났으면 → [../tasks.md](../tasks.md)의 **Phase 9 통합·배포**로
