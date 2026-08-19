# QA 기록 — Phase 9 통합 확인

2026-08-20, `npm run build` · `npx vitest run` · `npx tsc --noEmit` 전부 통과한 상태에서 Playwright로 실제 브라우저를 띄워 확인했다. 4명이 실제로 모이는 대신, 시드 계정 여러 개와 `/login`으로 새로 가입한 계정 2개를 오가며 같은 흐름을 재현했다.

## 9-1 통합

- [x] `npm run build` — 빌드 오류 0개
- [x] `npx vitest run` — 66개 테스트 전부 통과
- [x] `npx tsc --noEmit` — 타입 오류 0개
- [x] 상단 네비게이션 통일 — `components/NavBar.tsx` 하나를 `/search`·`/requests`·`/chat`·`/chat/[id]`·`/profile/[id]`·`/me`·`/admin`에 모두 붙였다. 관리자 계정으로 로그인하면 "관리자" 탭이 자동으로 뜬다
- [x] 화면 폭 통일 — 모든 화면이 `max-w-2xl` 기준으로 맞춰졌다 (관리자 화면은 기존 `max-w-3xl`에서 조정)
- [x] 임시 컴포넌트 교체 확인 — `grep`으로 찾아본 결과 남아있는 placeholder 컴포넌트 없음 (`TagPicker`·`TagChip`·`Avatar`는 처음부터 B의 실제 컴포넌트로 만들어졌다)
- [x] 모바일 뷰 확인 — Playwright의 iPhone 13 에뮬레이션으로 검색·채팅·관리자·정지 화면을 열어 스크린샷 확인, 가로 스크롤이나 레이아웃 깨짐 없음

## 9-2 배포 준비

- [x] GitHub에 계속 push해 왔다 (커밋마다)
- [x] `resetStore()`를 부를 수 있는 버튼 — `/me` 하단에 "시뮬레이션 데이터 초기화" 추가 (확인 창 포함), 로그아웃 버튼도 함께 추가
- [x] Vercel 배포 완료 — https://claude-mauve-eta-26.vercel.app
- [x] 🔍 배포 주소에서 학교 메일 로그인 확인 — Playwright로 실제 배포 주소에 접속해 랜딩(시뮬레이션 모드 문구) → 로그인 → 온보딩 → 검색(카드 20개)까지 정상 동작 확인

## 9-3 최종 전체 흐름

`/login`으로 새 계정 2개(`newp1@kyonggi.ac.kr`, `newp2@kyonggi.ac.kr`)를 실제로 가입시켜 처음부터 끝까지 확인했다.

- [x] 학교 메일로 가입 → 온보딩(닉네임·출생연도·성별·학과·태그·한 줄 소개) → 프로필 완성
- [x] 서로를 검색 결과에서 찾을 수 있다
- [x] 신청(인사말 포함) → 수락 → 대화방 생성 → 메시지 주고받기 (실시간 반영 포함)
- [x] 대화방에서 "만났어요" → 밸런스게임 화면 진입, 큰 글씨로 질문이 보인다 (선택 UI 없음)
- [x] 한 명이 다른 한 명을 차단 → 검색·대화방 목록 양쪽에서 서로 사라진다
- [x] 서로 다른 계정 3개(`u2`·`u5`·`u6`)가 한 명을 신고 → 관리자 화면에 뜬다 → 관리자가 정지 처리 → 그 계정이 `/suspended` 화면을 본다

## 발견해서 고친 버그 (Phase 9 진행 중)

1. **`getStore()` 메모리 캐시가 다른 탭의 변경을 못 읽음** — 채팅방의 "실시간" 요구사항(storage 이벤트)이 실제로는 반영되지 않던 문제. `lib/mock/store.ts`에 `reloadFromStorage()`를 추가해 storage 이벤트를 받을 때마다 캐시를 무효화하도록 고쳤다.
2. **`getMyConversations()`가 차단 여부를 걸러내지 않음** — 차단해도 기존 대화방이 목록에 계속 보이던 문제. 차단 필터를 추가했다.

두 버그 모두 유닛 테스트로 먼저 재현한 뒤 고쳤고, `tests/store.test.ts`·`tests/mockApi.test.ts`에 회귀 테스트로 남아 있다.
