# 친구 만들기 앱 구현 계획

> **에이전트로 실행할 경우:** `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans` 스킬을 사용해 단계별로 진행한다. 모든 항목은 체크박스(`- [ ]`) 형식이며 세부 체크리스트는 [tasks.md](tasks.md)에 있다.

**목표:** 경기대 재학생이 관심사로 사람을 검색하고, 친구 신청을 보내 수락되면 1:1 채팅을 하고, 만난 자리에서 밸런스게임으로 어색함을 푸는 웹앱을 만든다.

**아키텍처 (2026-08-19 변경 — Supabase 전면 제거):** 서버·DB가 전혀 없다. Next.js는 정적으로 배포되는 **순수 클라이언트 앱**이고, 데이터는 브라우저의 `localStorage`에만 저장된다. 실제 이메일 인증·실시간 서버 통신은 없다 — 화면에서 그렇게 보이도록 흉내 낸다. **업무 규칙(하루 신청 상한, 차단 반영, 신고 임계치)은 전부 `lib/mock/api.ts`의 TypeScript 함수에 넣는다.** 화면 코드는 규칙을 알 필요 없이 이 함수만 호출하므로, 4명이 서로 다른 화면을 동시에 만들어도 규칙이 어긋나지 않는다. 이 구조는 예전 Postgres RPC 구조를 그대로 옮긴 것이다 — 이름과 반환값 모양이 대응된다.

> **왜 바뀌었나**: 처음에는 실제 Supabase 무료 플랜 프로젝트를 팀이 공유하는 방식으로 만들었다(RLS·RPC·실제 로그인까지 전부 진짜로 동작). 이후 "Supabase를 아예 쓰지 않고 시뮬레이션만 돌린다"로 결정이 바뀌면서, DB·인증 서버 없이 브라우저 안에서만 완결되는 지금 구조로 다시 만들었다. `supabase/` 폴더의 SQL은 git 이력에는 남아 있지만 더는 쓰지 않는다.

**기술 스택:** Next.js 16 (App Router, TypeScript, 전부 Client Component) / Tailwind CSS / `localStorage` / Vitest / Vercel(또는 정적 호스팅 아무 곳이나) 배포

**스펙:** [SPEC.md](SPEC.md) — 이 계획서는 SPEC의 v1 범위(4장)만 구현한다. 커뮤니티·유료 기능은 대상이 아니다.

---

## 전역 제약

SPEC에서 가져온 프로젝트 전체 규칙이다. **모든 단계에 자동으로 적용된다.**

| 규칙 | 값 | 출처 |
|---|---|---|
| 가입 가능 이메일 | `@kyonggi.ac.kr` 로 끝나는 주소만 | SPEC 4.1 |
| 인증 전 접근 | 인증 미완료 사용자는 어떤 화면도 볼 수 없다 | SPEC 4.1 |
| 나이 | 자격 요건 아님. 표시·필터에만 사용 | SPEC 4.1 |
| 관심사 태그 | 고정 목록에서 **최대 5개**, 자유 입력 금지 | SPEC 4.2 |
| 프로필 사진 | **선택 항목**. 없으면 기본 이미지 | SPEC 4.2 |
| 성별 필터 기본값 | **"상관없음"** | SPEC 4.3 |
| 하루 친구 신청 상한 | **5건** | SPEC 4.4 |
| 인사말 | **필수**, 1~200자 | SPEC 4.4 |
| 수락 전 메시지 | **불가**. 인사말 한 줄이 전부 | SPEC 4.4 |
| 거절 통보 | 상대에게 알리지 않는다 | SPEC 4.4 |
| 차단 | 양방향 완전 숨김, 상대에게 알리지 않음, **제재 아님** | SPEC 4.5 |
| 신고 자동 검토 대기 | 서로 다른 사용자 **3명** 이상 | SPEC 4.5 |
| 검토 대기 중 노출 | **유지한다** (관리자 판단 전 정지 없음) | SPEC 4.5 |
| 정지 기본 기간 | 30일 (관리자가 조정 가능) | SPEC 4.5 |
| 밸런스게임 | 답을 **입력하지도 저장하지도 않는다** | SPEC 4.6 |
| 채팅 제외 항목 | 사진·파일·이모티콘 전송, 읽음 확인 표시, 메시지 삭제·수정 | SPEC 4.4 |
| 언어 | 화면 문구는 전부 한국어 | — |
| 백엔드 | **없음.** Supabase를 포함해 어떤 서버도 쓰지 않는다. 데이터는 `localStorage`뿐이다 | 2026-08-19 결정(최종) |
| 인증코드·서버 세션 | 없음. 로그인은 이메일 도메인만 확인하는 시뮬레이션이다 | 2026-08-19 결정(최종) |

---

## 파일 구조

```
친구만들기앱/
├─ SPEC.md                       기획서
├─ plan.md                       이 문서
├─ tasks.md                      체크리스트
├─ lib/
│  ├─ mock/
│  │  ├─ seed.ts                 초기 데이터 (태그·질문·더미 사용자 20명)
│  │  ├─ store.ts                localStorage 저장소 (get/persist/reset)
│  │  ├─ auth.ts                 로그인·로그아웃·프로필 생성
│  │  ├─ api.ts                  업무 규칙 함수 11개 (예전 RPC와 1:1 대응)
│  │  └─ useCurrentProfile.ts    로그인 상태를 읽는 훅
│  ├─ types.ts                   데이터 모델 타입 (공용)
│  ├─ appName.ts                 앱 이름 (아직 미정)
│  ├─ departments.ts             학과 목록 (임시)
│  ├─ age.ts                     출생연도 → 나이
│  ├─ validation.ts              이메일·인사말·태그 검증
│  └─ limits.ts                  남은 신청 횟수 계산
├─ components/
│  ├─ ProfileCard.tsx            검색 결과 카드
│  ├─ TagPicker.tsx              태그 선택 (최대 5개)
│  ├─ TagChip.tsx                태그 한 개 표시
│  ├─ Avatar.tsx                 사진 없으면 기본 이미지
│  ├─ MessageBubble.tsx          채팅 말풍선
│  └─ ReportDialog.tsx           신고 사유 선택 창
├─ app/
│  ├─ layout.tsx  globals.css
│  ├─ page.tsx                   랜딩 (전부 'use client')
│  ├─ login/page.tsx             학교 이메일 입력 (이것만으로 로그인)
│  ├─ onboarding/page.tsx        프로필 최초 작성
│  ├─ me/page.tsx                내 프로필 편집
│  ├─ search/page.tsx            검색 + 필터
│  ├─ profile/[id]/page.tsx      상대 프로필 · 신청 · 차단 · 신고
│  ├─ requests/page.tsx          받은/보낸 신청
│  ├─ chat/page.tsx              대화방 목록
│  ├─ chat/[id]/page.tsx         대화방
│  ├─ chat/[id]/meet/page.tsx    대면 밸런스게임
│  ├─ admin/page.tsx             신고 목록 · 처리
│  └─ suspended/page.tsx         정지 안내
└─ tests/                        Vitest 단위 테스트
```

**서버 쪽 파일이 전부 없어졌다.** `supabase/`, `lib/supabase/`, `proxy.ts`(접근 차단 미들웨어), `app/actions/*.ts`(서버 액션), `.env.local`은 더 이상 쓰지 않는다. 화면은 전부 `'use client'`이고, `app/actions/*.ts`가 하던 일은 `lib/mock/api.ts`·`lib/mock/auth.ts`를 컴포넌트가 직접 호출하는 것으로 바뀌었다. 접근 차단(로그인 안 했으면 `/login`으로 등)은 미들웨어가 아니라 **각 페이지 안의 `useEffect`**가 한다 — 서버가 없으니 서버가 미리 막아줄 방법이 없기 때문이다.

---

## 시뮬레이션 데이터 저장소 (`lib/mock/store.ts`)

브라우저 `localStorage` 한 키(`friend-app-sim-v1`)에 아래 모양의 JSON 하나를 통째로 저장한다. Postgres 테이블이 하던 역할을 배열들이 대신한다.

```ts
type Store = {
  profiles: Profile[]              // 사용자. email 필드는 로그인 조회용, 화면엔 안 보여준다
  profileTags: { profile_id, tag_id }[]
  friendRequests: FriendRequest[]
  conversations: Conversation[]
  messages: Message[]
  conversationReads: { conversation_id, user_id, last_read_at }[]
  blocks: { blocker_id, blocked_id, created_at }[]
  reports: Report[]
}
```

- 처음 접속하면 `lib/mock/seed.ts`의 초기 데이터(태그 20개·질문 30개·더미 사용자 20명·신청 6건·대화방 1개)로 채워진다
- "지금 로그인한 사람"은 별도 키(`friend-app-sim-current-user`)에 사용자 id만 저장한다
- `resetStore()`를 부르면 전부 초기 상태로 되돌아간다 — 발표 리허설 사이에 초기화할 때 쓴다
- **"로그인한 사람"은 `sessionStorage`(탭마다 독립)에, 실제 데이터는 `localStorage`(탭끼리 공유)에 있다.** 그래서 같은 브라우저에서 탭을 두 개 열어 각각 다른 계정으로 로그인하면, 두 사람 역할을 동시에 테스트할 수 있다 — 소개팅·친구 앱을 혼자 개발할 때 흔히 겪는 "두 계정을 동시에 어떻게 보나" 문제를 이렇게 풀었다
- **탭 사이 실시간 동기화는 된다.** 브라우저는 같은 출처의 다른 탭에서 `localStorage`가 바뀌면 `window`의 `storage` 이벤트를 쏴 준다. D의 채팅 화면(Phase 5)은 이 이벤트를 구독하면 서버 없이도 "실시간"처럼 보이게 만들 수 있다 (단, 시크릿 창 등 완전히 다른 브라우저 컨텍스트끼리는 이 이벤트가 안 온다 — 그 경우 새로고침해야 상대 메시지가 보인다)

이전 SQL 설계(`supabase/migrations/001_schema.sql`)는 git 이력에 남아 있다. 테이블 이름·컬럼은 위 타입과 그대로 대응되므로, 나중에 실제 서버로 전환할 때 참고할 수 있다.

## 업무 규칙 함수 (`lib/mock/api.ts`)

**화면 코드는 이 함수들만 호출한다.** 예전 RPC 11개와 이름·역할이 그대로 대응된다.

| 함수 | 하는 일 |
|---|---|
| `searchProfiles(filters)` | 필터 적용 검색. 나 자신·차단 양방향·정지 중인 사람을 자동 제외, 태그는 OR |
| `remainingRequestsToday()` | 오늘 남은 신청 횟수 |
| `sendFriendRequest(receiverId, greeting)` | 하루 5건 상한·중복·차단·자기 자신·정지 검사 후 신청 생성 |
| `respondFriendRequest(requestId, accept)` | 수락이면 대화방 id, 거절이면 `null` |
| `blockUser(targetId)` / `unblockUser(targetId)` | 차단 추가·해제 (제재 아님) |
| `reportUser(targetId, reason, detail?)` | 신고 생성 + 상호 차단 자동 적용 |
| `markConversationRead(conversationId)` | 내 읽음 시각 갱신 (상대에게 노출 안 됨) |
| `unreadCount(conversationId)` | 안 읽은 메시지 개수 |
| `adminReportQueue()` | 서로 다른 신고자 3명 이상인 대상 목록 (관리자 아니면 오류) |
| `adminResolveReport(reportedId, action, days?)` | `dismissed`/`warned`/`suspended` 처리. 관리자만 |
| `adminMetrics()` | 성공 지표 6개 (SPEC 8장) |

모든 함수는 `{ data, error }` 형태를 돌려준다(로그인·자기 자신·중복·상한 등 위반 시 `error`에 한국어 문구가 들어간다. 화면은 그 문구를 그대로 보여주면 된다). 인증·차단·프로필 관련 함수는 `lib/mock/auth.ts`에 따로 있다: `signInWithSchoolEmail(email)` · `signOut()` · `getCurrentProfile()` · `createProfile(input)` · `hasCompletedProfile(profile)` · `isSuspended(profile)`.

**로그인 상태를 화면에서 읽는 법**: `lib/mock/useCurrentProfile.ts`의 `useCurrentProfile()` 훅을 쓴다. `{ profile, loading }`을 돌려주며, `loading`이 끝난 뒤에야 리다이렉트 여부를 판단해야 한다(마운트 전에 판단하면 로그인된 사람도 잘못 튕긴다). A가 만든 `app/login`·`app/onboarding`·`app/suspended`·`app/admin`이 이 패턴의 예시다 — 새 페이지를 보호할 때 그대로 따라 하면 된다.

## 팀 4명 역할 분담안

역할이 아직 정해지지 않았으므로 **기능 축으로 4갈래**를 제안한다. 서로 건드리는 파일이 겹치지 않도록 나눴다.

| 담당 | 이름 | 맡는 화면·파일 | 담당 Phase |
|---|---|---|---|
| **A** | 기반·인증·운영 | `lib/mock/**`, `lib/types.ts`, `app/login/**`, `app/onboarding`, `app/admin`, `app/suspended`, 배포 | 0 · 1 · 7 · 9 |
| **B** | 프로필·안전장치 | `app/me`, `app/profile/[id]`, `components/TagPicker` `TagChip` `Avatar` `ReportDialog` | 2 · 6 |
| **C** | 검색·친구 신청 | `app/search`, `app/requests`, `components/ProfileCard` | 3 · 4 |
| **D** | 채팅·밸런스게임 | `app/chat/**`, `components/MessageBubble` | 5 · 8 |

**A는 첫날 반드시 혼자 앞서 나가야 한다.** Phase 0이 끝나기 전에는 B·C·D가 할 일이 없다. 대신 Phase 0에 **더미 사용자 20명·신청 5건·대화방 1개를 미리 넣어두기 때문에**, Phase 0이 끝나는 순간 B·C·D는 서로를 기다리지 않고 동시에 시작할 수 있다.

**추천 일정 (6일 기준)**

| 일차 | A | B | C | D |
|---|---|---|---|---|
| 1일 | Phase 0 (전원이 옆에서 함께 셋업) | | | |
| 2일 | Phase 1 인증 | Phase 2 프로필 | Phase 3 검색 | Phase 5 채팅 |
| 3일 | Phase 1 마무리 | Phase 2 마무리 | Phase 4 신청 | Phase 5 마무리 |
| 4일 | Phase 7 관리자 | Phase 6 차단·신고 | Phase 4 마무리 | Phase 8 밸런스게임 |
| 5일 | **Phase 9 통합** — 4명이 한자리에서 전체 흐름을 처음부터 끝까지 돌린다 | | | |
| 6일 | 배포·발표 준비 | | | |

**규칙 세 가지**

1. `lib/types.ts`와 `lib/mock/**`는 **A만 수정한다.** 다른 사람이 데이터 모양·업무 규칙 변경이 필요하면 A에게 요청한다. 동시에 고치면 반드시 충돌한다.
2. 각자 `feature/<이름>-<기능>` 브랜치에서 작업하고, Phase 하나가 끝날 때마다 `main`에 합친다. 하루 이상 안 합치지 않는다.
3. 모든 Phase는 **"눈으로 확인" 절차를 통과해야 끝난 것이다.** 확인 결과를 `docs/QA.md`에 한 줄씩 남긴다.

---

## Phase 0 — 프로젝트 기반 (담당 A, 전원 참관) — **완료**

**끝나면 보이는 것:** `npm run dev` 후 브라우저에 "친구만들기앱 · 시뮬레이션 모드 · 사용자 20명" 이 뜬다. `.env.local`도 계정 가입도 필요 없다.

**만드는 파일:** `package.json`, `app/layout.tsx`, `app/page.tsx`, `lib/mock/{seed,store}.ts`, `lib/types.ts`, `vitest.config.mts`

**핵심 작업**

1. `npx create-next-app@latest . --typescript --tailwind --app --eslint` 으로 프로젝트 생성
2. `lib/mock/seed.ts`에 태그 20개·밸런스게임 질문 30개·더미 사용자 20명·신청 6건·대화방 1개(메시지 6개)를 값으로 적는다
3. `lib/mock/store.ts`가 처음 접속 시 이 시드로 `localStorage`를 채우고, 이후에는 저장된 값을 읽는다
4. `app/page.tsx`가 (client component에서 `useEffect`로) 저장소의 사용자 수를 세어 화면에 출력

**눈으로 확인**

- [x] `npm run dev` → `http://localhost:3000` 에 "사용자 20명"이 표시된다
- [x] 브라우저 개발자 도구 → Application → Local Storage에 `friend-app-sim-v1` 키가 보이고, JSON 안에 `profiles` 20개가 있다
- [x] `npm run build`, `npm test` 통과

---

## Phase 1 — 재학생 인증 (담당 A)

**끝나면 보이는 것:** 학교 이메일 주소를 입력하면 바로 로그인되고, 프로필을 작성해 검색 화면까지 들어간다. 다른 도메인 메일은 거부된다.

**만드는 파일:** `app/login/page.tsx`, `app/onboarding/{page,OnboardingForm}.tsx`, `app/suspended/page.tsx`, `lib/mock/auth.ts`, `lib/mock/useCurrentProfile.ts`, `lib/validation.ts`, `tests/validation.test.ts`

**흐름 (2026-08-19 변경 — Supabase 전면 제거)**

서버도 세션도 없다. `lib/mock/auth.ts`의 `signInWithSchoolEmail(email)`이 도메인만 확인하고, 그 이메일로 이미 만든 계정이 있으면 그 계정을, 없으면 프로필 없는 새 계정을 `localStorage`에 만든다. "로그인 상태"는 별도 키에 사용자 id 하나를 적어두는 것뿐이다.

```
/login  학교 이메일 입력
   → isSchoolEmail() 로 도메인 확인
   → signInWithSchoolEmail(email) — 계정이 없으면 자동으로 만든다
   → 프로필(닉네임 등)이 있으면 /search, 없으면 /onboarding
```

**이메일 주소만 알면 그 사람으로 로그인된다.** 비밀번호도 인증코드도 없다. 실제 학생을 받는 서비스가 된다면 이 방식 전체를 진짜 인증으로 바꿔야 한다 — 지금은 팀 내 시연 전용이다.

**접근 차단은 미들웨어가 아니라 각 페이지의 `useEffect`가 한다** (SPEC 4.1: 인증 전 어떤 화면도 못 봄). 서버가 없어 요청을 가로챌 방법이 없으므로, `useCurrentProfile()`로 로그인 상태를 읽은 뒤 `loading`이 끝나면 판단한다.

- 로그인 안 됨 → `/login`으로
- 로그인은 됐지만 프로필(닉네임) 없음 → `/onboarding`으로
- `isSuspended(profile)` → `/suspended`로
- 이미 조건을 만족한 상태로 `/login`·`/onboarding`·`/suspended`에 들어오면 `/search`로 돌려보낸다 (예: 로그인 다 된 사람이 `/login`을 다시 열면)

**눈으로 확인**

- [x] `test@gmail.com` 입력 → "경기대학교 이메일(@kyonggi.ac.kr)만 사용할 수 있습니다" 오류가 뜬다
- [x] 본인 `@kyonggi.ac.kr` 주소 입력 → 바로 `/onboarding`으로 넘어간다
- [x] 같은 이메일로 다시 로그인 → 온보딩을 건너뛰고 바로 검색 화면으로 간다
- [x] 프로필 작성 완료 → `/search`로 이동하고, `localStorage`의 `profiles`에 내 행이 생긴다
- [ ] 로그아웃 후 주소창에 `/search`를 직접 입력 → `/login`으로 튕긴다 (C가 `/search`를 만든 뒤 확인)

---

## Phase 2 — 프로필 (담당 B)

**끝나면 보이는 것:** 내 프로필을 고치고 사진을 올릴 수 있다. 사진을 안 올려도 태그 색 배경의 기본 이미지가 나온다. 태그는 6개째부터 선택되지 않는다.

**만드는 파일:** `app/me/page.tsx` (`'use client'`), `components/TagPicker.tsx`, `components/TagChip.tsx`, `components/Avatar.tsx`, `tests/tagpicker.test.ts`

`lib/age.ts`·`tests/age.test.ts`는 A가 이미 만들어 뒀다. 새로 만들지 않는다. 프로필 수정은 `lib/mock/auth.ts`에 `updateProfile()` 함수를 A에게 요청해 추가하거나(현재는 `createProfile()`만 있다), 직접 `lib/mock/store.ts`의 `getStore()`로 내 프로필 행을 찾아 고치고 `persist()`를 부른다.

**화면 구성 (SPEC 4.2 — 태그가 주인공)**

```
┌──────────────────────────────┐
│  [아바타]  닉네임 (24세 · 컴퓨터공학과) │
│                                        │
│  #운동헬스  #보드게임  #맛집            │  ← 가장 크게
│                                        │
│  "같이 헬스장 갈 사람 구해요"           │
└──────────────────────────────┘
```

**주의할 점**

- 태그는 `lib/mock/seed.ts`의 `TAGS` **고정 목록**이다. 자유 입력창을 만들지 않는다
- 6개째 선택 시도 시 조용히 무시하지 말고 "최대 5개까지 고를 수 있어요" 문구를 띄운다
- **사진 업로드는 서버 저장소가 없다.** `FileReader.readAsDataURL()`로 base64 문자열을 만들어 `profile.photo_url`에 그대로 저장한다. 5MB 초과·이미지 아닌 파일은 거부한다. `localStorage`는 도메인당 보통 5~10MB 한도이므로, 사진을 올린 계정이 여러 개면 용량이 금방 찬다 — 발표 데모 용도로는 충분하다
- 나이는 `birth_year`만 저장하고 화면에서 계산한다 (`lib/age.ts`)

**눈으로 확인**

- [ ] 태그를 5개 고른 뒤 6개째를 누르면 안내 문구가 뜨고 선택되지 않는다
- [ ] 사진 없이 저장 → 기본 아바타가 보인다
- [ ] 사진 업로드 → 새로고침해도 사진이 유지된다
- [ ] 닉네임을 13자 이상 입력 → 저장이 막히고 오류 문구가 뜬다
- [ ] `npx vitest run` → `age.test.ts`, `tagpicker.test.ts` 통과

---

## Phase 3 — 검색과 필터 (담당 C)

**끝나면 보이는 것:** 필터를 걸면 더미 사용자 20명 중 조건에 맞는 사람만 카드로 나온다. 필터를 바꾸면 결과가 즉시 바뀐다.

**만드는 파일:** `app/search/page.tsx` (`'use client'`), `components/ProfileCard.tsx`, `tests/searchparams.test.ts`

서버 액션이 없으니 `app/actions/search.ts`는 만들지 않는다. 화면에서 `lib/mock/api.ts`의 `searchProfiles(filters)`를 직접 부른다 — 동기 함수라 `await` 없이 바로 배열이 온다.

**필터 4종 (SPEC 4.3)**

| 필터 | 기본값 | 비고 |
|---|---|---|
| 성별 | **상관없음** | "만나고 싶은 성별"이 아니라 "성별"로 표기 |
| 나이대 | 19–30 | 슬라이더 |
| 학과 | 상관없음 | 전체 / 특정 학과 / 내 학과만 |
| 관심사 태그 | 없음 | 여러 개 선택 시 **하나라도 겹치면** 노출 |

- 정렬은 `last_seen_at desc` (최근 접속순)
- 필터 상태를 URL 쿼리스트링에 반영한다 — 새로고침해도 유지되고, 팀원끼리 링크로 재현할 수 있다
- 결과 0명일 때 빈 화면 대신 "조건을 넓혀보세요" + 필터 초기화 버튼

**눈으로 확인**

- [ ] 아무 조건 없이 검색 → 나를 제외한 사용자가 나온다 (내 카드는 없다)
- [ ] 성별 "여" 선택 → 여성만 나온다
- [ ] 태그 "게임" 선택 → 게임 태그를 가진 사람만 나온다
- [ ] 태그 "게임"+"등산" 선택 → 둘 중 **하나라도** 가진 사람이 나온다
- [ ] 나이대를 19–20으로 좁힘 → 결과가 줄고, 0명이면 안내 문구가 뜬다
- [ ] 필터를 건 상태에서 새로고침 → 필터가 유지된다

---

## Phase 4 — 친구 신청과 수락 (담당 C)

**끝나면 보이는 것:** 상대 프로필에서 인사말을 적어 신청을 보낸다. 6번째 신청은 거부된다. 받은 신청을 수락하면 대화방이 생긴다.

**만드는 파일:** `app/profile/[id]/page.tsx`(신청 부분, `'use client'`), `app/requests/page.tsx`(`'use client'`)

`lib/limits.ts`·`tests/limits.test.ts`는 A가 이미 만들어 뒀다. 서버 액션이 없으니 `app/actions/requests.ts`는 만들지 않는다 — `lib/mock/api.ts`의 `sendFriendRequest()`·`respondFriendRequest()`·`remainingRequestsToday()`를 화면에서 직접 부른다.

**두 화면**

- `/profile/[id]` — 상대 프로필 + "친구 신청" 버튼. 누르면 인사말 입력창(1~200자, 필수)이 열린다. 이미 신청했으면 버튼이 "신청함(대기 중)"으로 바뀐다
- `/requests` — 탭 2개. **받은 신청**(인사말·프로필 요약·수락/거절), **보낸 신청**(상태 표시)

**놓치기 쉬운 것**

- 남은 신청 횟수를 신청 버튼 옆에 항상 보여준다 (`오늘 3/5`). 안 보여주면 6번째에서 갑자기 막혀 사용자가 당황한다
- **거절은 상대에게 알리지 않는다.** 보낸 신청 목록에서 거절된 건은 "응답 없음"과 구별되지 않게 표시한다 — 둘 다 회색 "대기 중"으로 두고, 거절 사실은 노출하지 않는다
- 수락 성공 시 바로 `/chat/[대화방id]`로 이동시킨다

**눈으로 확인**

- [ ] 인사말을 비운 채 신청 → 버튼이 눌리지 않고 "인사말을 입력해 주세요"가 뜬다
- [ ] 신청 성공 → 버튼이 "신청함(대기 중)"으로 바뀌고 카운터가 `1/5`로 는다
- [ ] 서로 다른 사람에게 5번 신청 후 6번째 시도 → "하루에 보낼 수 있는 신청은 5건입니다"
- [ ] 같은 사람에게 두 번 신청 → 막힌다
- [ ] 다른 탭에서 두 번째 계정으로 로그인 → `/requests`에 신청이 보인다
- [ ] 수락 → 두 계정 모두 `/chat`에 대화방이 생긴다
- [ ] 거절 → 보낸 쪽 화면에 "거절당했다"는 표시가 **없다**

---

## Phase 5 — 1:1 채팅 (담당 D)

**끝나면 보이는 것:** 같은 브라우저에서 탭 두 개를 나란히 띄우고(각 탭에서 다른 계정으로 로그인) 한쪽에서 메시지를 보내면 다른 쪽에 새로고침 없이 즉시 뜬다.

**만드는 파일:** `app/chat/page.tsx`(`'use client'`), `app/chat/[id]/page.tsx`(`'use client'`), `components/MessageBubble.tsx`

서버 액션이 없으니 `app/actions/chat.ts`는 만들지 않는다. 메시지 전송·조회는 `lib/mock/store.ts`의 `getStore()`/`persist()`를 직접 쓴다 (전용 함수가 필요하면 A에게 `lib/mock/api.ts`에 `sendMessage()` 추가를 요청한다).

**"실시간"은 서버 없이 `storage` 이벤트로 흉내 낸다**

```ts
// app/chat/[id]/page.tsx
useEffect(() => {
  function onStorage(e: StorageEvent) {
    if (e.key === 'friend-app-sim-v1') {
      // 다른 탭에서 localStorage가 바뀌었다 — 다시 읽어서 화면을 갱신한다
      setMessages(getStore().messages.filter(m => m.conversation_id === conversationId))
    }
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}, [conversationId])
```

`storage` 이벤트는 **같은 브라우저의 다른 탭·창**에서 값이 바뀔 때만 온다. 시크릿 창이나 다른 브라우저처럼 완전히 분리된 컨텍스트끼리는 오지 않으므로 그 경우엔 새로고침해야 상대 메시지가 보인다 — 시연 시 "같은 브라우저에서 탭 두 개"로 보여주면 실시간처럼 보인다.

**대화방 목록 (`/chat`)** — 상대 닉네임·아바타, 마지막 메시지 미리보기, 안 읽은 개수 배지. 안 읽은 개수는 `lib/mock/api.ts`의 `unreadCount(conversationId)`가 계산해 준다.

**만들지 않는 것 (SPEC 4.4 제외 항목):** 사진·파일·이모티콘 전송, 읽음 확인 표시, 메시지 삭제·수정.

**눈으로 확인**

- [ ] 창 두 개를 나란히 놓고 한쪽에서 전송 → 다른 쪽에 **새로고침 없이** 나타난다
- [ ] 새로고침해도 지난 대화가 남아 있다
- [ ] 내 메시지는 오른쪽, 상대 메시지는 왼쪽에 붙는다
- [ ] 빈 메시지는 전송되지 않는다
- [ ] `/chat` 목록에 마지막 메시지와 안 읽은 개수 배지가 보이고, 방에 들어가면 배지가 사라진다
- [ ] 내 대화방이 아닌 id를 주소창에 직접 입력 → 접근이 막힌다

---

## Phase 6 — 차단과 신고 (담당 B)

**끝나면 보이는 것:** 차단하면 그 사람이 검색·대화방 어디에도 안 보이고, 상대 쪽에서도 내가 사라진다. 신고하면 관리자 목록에 쌓인다.

**만드는 파일:** `app/profile/[id]/page.tsx`(차단·신고 부분), `components/ReportDialog.tsx`

서버 액션이 없으니 `app/actions/safety.ts`는 만들지 않는다. `lib/mock/api.ts`의 `blockUser()`·`unblockUser()`·`reportUser()`를 화면에서 직접 부른다.

**두 기능을 화면에서도 명확히 구분한다 (SPEC 4.5)**

| | 버튼 문구 | 확인 문구 |
|---|---|---|
| 차단 | "이 사람 숨기기" | "서로에게 보이지 않게 됩니다. 상대는 알 수 없어요. 언제든 해제할 수 있습니다." |
| 신고 | "신고하기" | "규칙 위반을 관리자에게 알립니다. 신고하면 서로 자동으로 숨겨집니다." |

- 차단 문구 어디에도 "제재", "정지", "처벌"이라는 말을 쓰지 않는다. 차단은 벌이 아니다
- 신고 사유 6종: 욕설·비하 / 성적 불쾌감 / 사기·홍보 / 만남 강요 / 프로필 사칭 / 기타
- 차단 해제는 `/me` 안의 "숨긴 사람 목록"에서 한다

**눈으로 확인**

- [ ] A가 B를 차단 → A의 검색 결과에서 B가 사라진다
- [ ] 같은 순간 **B의 검색 결과에서도 A가 사라진다** (양방향)
- [ ] B 화면에 차단당했다는 어떤 표시도 없다
- [ ] 차단 상태에서 서로 친구 신청 시도 → 막힌다
- [ ] `/me`의 숨긴 사람 목록에서 해제 → 다시 검색에 나온다
- [ ] 신고 후 개발자 도구의 `localStorage`(`friend-app-sim-v1`)를 열어 `reports`에 행이 생기고 `blocks`에도 양방향 행이 생겼는지 확인한다
- [ ] 서로 다른 계정 3개(탭 3개)로 같은 사람을 신고 → 관리자 계정의 `/admin`에 그 사람이 뜬다

---

## Phase 7 — 관리자 화면 (담당 A) — **완료**

**끝나면 보이는 것:** 관리자 계정으로 `/admin`에 들어가면 신고 목록과 지표 카드 6개가 보이고, 정지 버튼을 누르면 그 사용자가 다음 로그인 때 정지 안내 화면을 본다.

**만드는 파일:** `app/admin/{page,ReportRow}.tsx`, `lib/mock/api.ts`(관리자 함수 4개)

**화면**

- 신고 목록: 신고 대상 / 서로 다른 신고자 수 / 최근 신고일 / 사유 목록. **신고자 수 많은 순**으로 정렬
- 각 항목에 `기각` · `경고` · `정지(일수 입력, 기본 30)` 버튼
- 정지된 사용자는 다음에 화면을 열 때(각 페이지의 `useEffect`가) `/suspended`로 보내고, 사유와 해제 예정일, 문의 이메일 주소를 보여준다
- 지표 카드 6개(SPEC 8장), "대화 이어진 관계 수"를 가장 크게

**반드시 지킬 것**

- `/admin`은 `is_admin === true`인 사람만 볼 수 있다. **화면 진입 체크만으로는 부족해서**, `adminReportQueue()`·`adminResolveReport()`·`adminMetrics()` 안에서도 각각 다시 `is_admin`을 확인한다 — 콘솔에서 함수를 직접 호출해도 막혀야 한다
- **검토 대기 중이라고 자동 정지하지 않는다** (SPEC 4.5). 목록에 올라와도 그 사람은 계속 정상 노출된다. 이걸 어기면 담합 신고로 무고한 사용자가 쫓겨난다

**눈으로 확인**

- [x] 일반 계정으로 `/admin` 접근 → `/search`로 튕긴다
- [x] `is_admin`을 `true`로 바꾼 계정 → 신고 목록·지표가 보인다 (`tests/mockApi.test.ts`로 로직 검증됨)
- [x] 신고 3건 쌓인 사용자가 목록에 뜨고, 정지해도 자동 정지는 안 됐는지 테스트로 확인
- [ ] 실제 화면에서 탭 여러 개로 신고 3건을 쌓아 눈으로 재확인 (B의 Phase 6 완성 후)

---

## Phase 8 — 대면 밸런스게임 (담당 D)

**끝나면 보이는 것:** 대화방에서 "만났어요"를 누르면 큰 글씨 질문이 뜨고, 넘기기로 계속 다음 질문을 본다. 답을 입력하는 곳이 없다.

**만드는 파일:** `app/chat/[id]/meet/page.tsx` (`'use client'`)

질문 목록은 DB가 아니라 `lib/mock/seed.ts`의 `BALANCE_QUESTIONS` 상수를 그대로 불러와 쓴다. 서버 조회가 없으니 로딩 상태를 만들 필요도 없다.

**화면 규칙 (SPEC 4.6)**

- 질문 하나만 화면 전체에 크게 (최소 32px, 두 선택지를 위아래로)
- 버튼은 **"다음 질문" 하나뿐**. 답 선택 버튼도, 입력창도 만들지 않는다
- 질문 순서는 무작위, 이미 나온 질문은 그 세션 안에서 다시 안 나온다
- 30개를 다 보면 "질문을 다 봤어요"와 처음부터 다시 보기 버튼
- 폰을 가운데 두고 보므로 **세로 화면 기준으로 만든다**

**눈으로 확인**

- [ ] 대화방에서 "만났어요" → 질문 화면으로 넘어간다
- [ ] 질문 글씨가 팔 하나 거리에서 읽힌다 (실제로 폰을 책상에 놓고 확인)
- [ ] "다음 질문"을 30번 눌러도 같은 질문이 두 번 안 나온다
- [ ] 30개를 다 보면 종료 안내가 뜬다
- [ ] **답을 입력하는 UI가 화면 어디에도 없다**
- [ ] 화면을 나갔다 다시 들어와도 `localStorage`에 아무 데이터도 안 쌓인다 (개발자 도구로 확인)

---

## Phase 9 — 통합·배포 (담당 A 주도, 전원 참여)

**중요한 한계부터 — 반드시 읽는다**

서버가 없으므로 **각 사람의 브라우저(또는 기기)마다 독립된 `localStorage`를 가진다.** 배포된 주소에 팀원 4명이 각자 자기 휴대폰·노트북으로 접속하면, 각자 자기만의 시드 데이터를 보게 되고 **서로를 실제로 찾거나 채팅할 수 없다** — 애초에 같은 저장소를 공유하지 않기 때문이다. 이건 버그가 아니라 "서버 없이 시뮬레이션만 돌린다"를 선택한 데 따른 당연한 결과다.

**그래서 시연은 이렇게 한다**: 발표자 한 명의 노트북 화면을 공유하고, **그 한 대의 브라우저 안에서 탭 여러 개**를 열어 계정을 바꿔가며 보여준다. `sessionStorage` 덕분에 탭마다 다른 계정으로 로그인할 수 있고, `localStorage`는 공유되므로 신청·채팅이 탭 사이에 실제로 오간다. 여러 대의 기기로 실제 사용자를 받는 서비스가 필요해지면, 그때는 Phase 0 이전으로 돌아가 실제 서버(예: 이전에 만들어 뒀던 Supabase 설계, git 이력에 있다)를 다시 연결해야 한다.

**끝나면 보이는 것:** 배포된 주소를 열고, 한 브라우저의 탭 여러 개로 검색·신청·채팅·신고·밸런스게임까지 전체 흐름을 처음부터 끝까지 보여줄 수 있다.

**작업**

1. Vercel(또는 아무 정적 호스팅)에 연결해 배포 — **환경 변수가 필요 없다**
2. 배포 주소에서 `resetStore()`를 한 번 부를 수 있는 버튼(또는 콘솔 명령)을 눈에 띄는 곳에 마련해 둔다 — 리허설 중간에 데이터를 처음 상태로 되돌리기 위해서다
3. `docs/QA.md`에 전체 흐름 통과 기록

**전체 흐름 눈 확인 (한 브라우저, 탭 4개 = 팀원 4명 역할)**

- [ ] 탭 4개에서 각각 학교 메일로 로그인 → 프로필 작성 완료 (탭마다 다른 계정이어야 한다 — `sessionStorage` 분리 확인)
- [ ] 서로를 검색으로 찾을 수 있다
- [ ] 신청 → 수락 → 채팅이 탭 사이에 실시간으로 반영된다 (`storage` 이벤트)
- [ ] 한 명이 다른 한 명을 차단 → 양쪽 탭 모두에서 사라진다
- [ ] 3개 탭에서 한 명을 신고 → 관리자 탭의 `/admin`에 뜬다 → 정지 처리 → 그 탭이 정지 화면을 본다
- [ ] 대화방에서 밸런스게임 화면이 열린다
- [ ] 휴대폰 브라우저로 접속해도 화면이 깨지지 않는다 (단, 휴대폰은 자기만의 빈 시드로 시작한다)

---

## 이번 구현에서 만들지 않는 것

SPEC 5장·6장에 따라 **손대지 않는다.** 시간이 남아도 여기에 쓰지 않는다.

- 커뮤니티 게시판 (SPEC 5.1, v2)
- 유료 기능·결제 (SPEC 5.2)
- 소그룹 매칭, 푸시 알림, 타 대학 확장
- 사진·파일·이모티콘 전송, 읽음 확인 표시, 메시지 삭제·수정
- 추천 알고리즘 (검색만 있다)
- 차단 누적 자동 정지
- 신고 이의제기 절차
