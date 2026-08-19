# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 현재 상태

**서버가 전혀 없다. Supabase를 포함해 어떤 백엔드도 쓰지 않는다 (2026-08-19 결정).**

처음에는 실제 Supabase 프로젝트(DB·인증·RLS·RPC)로 만들었다가, "Supabase를 아예 쓰지 않고 시뮬레이션만 돌린다"로 결정이 바뀌면서 전부 걷어냈다. `supabase/` 폴더는 삭제했다(git 이력에는 남아 있다). 지금은:

- Next.js 앱 전체가 `'use client'`다. 데이터는 브라우저 `localStorage`/`sessionStorage`에만 있다
- `.env.local`도, 회원가입도, 서버 설정도 필요 없다. `npm install && npm run dev`만 하면 바로 돌아간다
- Phase 0·1·7(기반·로그인·관리자)은 코드가 끝났고 테스트 36개가 통과한다. 다음은 [A-기반인증운영/tasks.md](A-기반인증운영/tasks.md)의 Phase 9(통합)와 B·C·D의 각 트랙이다

## 로그인 방식 — 시뮬레이션 전용

**`@kyonggi.ac.kr` 이메일 한 칸만 입력하면 로그인된다.** 인증코드도 비밀번호도 서버도 없다.

`lib/mock/auth.ts`의 `signInWithSchoolEmail(email)`이 도메인만 확인하고, 그 이메일로 이미 있는 계정이면 그 계정을, 없으면 프로필 없는 새 계정을 `localStorage`에 만든다. "로그인한 사람"은 `sessionStorage`에 사용자 id 하나로만 표시된다.

**이메일 주소만 알면 그 사람으로 로그인된다.** 팀 내 시연 범위이기 때문에 허용되는 지름길이다. 실제 서비스가 된다면 반드시 진짜 인증으로 되돌려야 한다.

## 문서 구조와 읽는 순서

| 문서 | 내용 | 언제 읽나 |
|---|---|---|
| [SPEC.md](SPEC.md) | 기획서. 무엇을 왜 만드는지, 확정된 결정, 미해결 항목 | 항상 먼저 |
| [plan.md](plan.md) | 구현 계획. `lib/mock/` 데이터 모양, 업무 규칙 함수 11개, Phase 0~9 | 코드 쓰기 전 |
| [tasks.md](tasks.md) | 전체 인덱스. 공통 규칙, 일정, 트랙 간 의존 관계 | 작업 시작 전 |
| `{A,B,C,D}-*/tasks.md` | 담당자별 체크리스트 | 자기 트랙 작업 중 |
| [FILES.md](FILES.md) | 지금 어떤 파일이 있고 뭘 하는지, 검증 상태 | 뭐가 어디 있는지 헷갈릴 때 |

**데이터 모양과 업무 규칙 함수 11개의 목록은 plan.md 안에 있다.** 실제 구현은 `lib/mock/api.ts`가 정답이다 — plan.md는 그걸 설명하는 문서다.

## 명령어

```bash
npm run dev                            # 개발 서버 (localhost:3000)
npm run build                          # 프로덕션 빌드
npm test                               # 전체 테스트 (vitest)
npx vitest run tests/limits.test.ts    # 단일 테스트 파일
npm run typecheck                      # 타입 검사
```

`npx tsc --noEmit`을 `next build` 없이 처음 돌리면 Next가 만드는 전역 타입이 아직 없어 실패할 수 있다. 그럴 때는 `npm run build`를 한 번 돌린 뒤 다시 검사한다.

## 아키텍처의 핵심 판단

**업무 규칙은 전부 `lib/mock/api.ts`에 있고, 화면 코드에는 없다.**

하루 신청 상한 5건, 차단 양방향 반영, 신고 임계치 3명, 정지 여부 판정 — 이 규칙들은 `lib/mock/api.ts`의 함수 안에만 구현한다(예전 Supabase RPC 11개를 그대로 옮긴 것이다). 화면 코드는 이 함수를 호출하고 `{ error }`를 그대로 보여주기만 한다.

이렇게 한 이유는 4명이 서로 다른 화면을 동시에 만들기 때문이다. 규칙을 화면마다 구현하면 네 벌이 생기고 서로 어긋난다. **화면 코드에서 상한을 세거나 차단 여부를 판단하는 코드를 발견하면 그것은 버그다.**

주요 함수: `searchProfiles` · `sendFriendRequest` · `respondFriendRequest` · `blockUser`/`unblockUser` · `reportUser` · `markConversationRead` · `adminResolveReport` (시그니처는 plan.md 참고)

**접근 차단(로그인 안 됨/프로필 없음/정지 중)은 미들웨어가 아니라 각 페이지의 `useEffect`가 한다.** 서버가 없어 요청을 미리 가로챌 방법이 없다. `lib/mock/useCurrentProfile.ts`의 `useCurrentProfile()` 훅으로 로그인 상태를 읽고, `loading`이 끝난 뒤에 리다이렉트를 판단한다 — `app/login`·`app/onboarding`·`app/suspended`·`app/admin`이 이 패턴의 예시다.

**"로그인한 사람"은 `sessionStorage`(탭마다 독립), 실제 데이터는 `localStorage`(탭끼리 공유)에 있다.** 이 분리 덕분에 같은 브라우저에서 탭 여러 개를 열어 서로 다른 계정으로 로그인하면서도, 데이터는 공유돼 친구 신청·채팅을 실제로 주고받을 수 있다. 반대로 **서로 다른 브라우저·기기끼리는 데이터가 전혀 공유되지 않는다** — 배포해도 팀원 4명이 각자 휴대폰으로 접속하면 서로를 찾을 수 없다. 시연은 한 브라우저의 탭 여러 개로 한다.

## 코드가 어기면 안 되는 것

SPEC에서 확정된 것들이다. 편의상 바꾸고 싶어지는 것만 추렸다.

| 규칙 | 어기면 |
|---|---|
| `@kyonggi.ac.kr` 이메일만 가입 (`lib/validation.ts`의 `isSchoolEmail()`) | 아무나 들어옴 |
| 인증 안 한 사용자는 어떤 화면도 못 봄 (각 페이지의 `useEffect` 가드) | SPEC 4.1 위반 |
| 관심사 태그는 **고정 목록**, 자유 입력 금지 | 표기 차이로 검색이 갈라짐 |
| 프로필 사진은 **선택** | 소개팅 앱과 구별이 사라짐 |
| 성별 필터 기본값은 **"상관없음"** | 연애 앱이 됨 |
| 태그 필터는 **OR** (하나라도 겹치면 노출) | 작은 풀에서 결과가 항상 0명 |
| 하루 신청 5건, 인사말 1~200자 필수 | 무차별 신청 |
| 거절과 무응답을 화면에서 **구별하지 않음** | SPEC 4.4 위반 |
| 차단은 **양방향**, 상대에게 알리지 않음, **제재 아님** | SPEC 4.5 위반 |
| 신고 누적으로 **자동 정지하지 않음** (관리자가 판단) | 담합 신고로 무고한 사용자가 정지됨 |
| 밸런스게임 답은 **저장하지 않음** (선택 버튼·입력창 자체를 안 만듦) | SPEC 4.6 위반 |
| 채팅에 사진·파일·이모티콘, 읽음 확인 표시, 삭제·수정 **없음** | v1 범위 초과 |
| 커뮤니티 게시판·유료 기능은 **v1 대상 아님** | 범위 초과 |

## 팀 분담과 파일 소유권

4명이 기능 축으로 나눠 병렬 작업한다. **글자는 이름표일 뿐 순서가 아니다.**

| 트랙 | 담당 영역 | 주 작업 파일 |
|---|---|---|
| A | 기반·인증·운영 | `lib/mock/**`, `lib/types.ts`, `app/login/**`, `app/onboarding`, `app/admin`, `app/suspended` |
| B | 프로필·안전장치 | `app/me`, `components/TagPicker` `TagChip` `Avatar` `ReportDialog` |
| C | 검색·친구 신청 | `app/search`, `app/profile/[id]`, `app/requests`, `components/ProfileCard` |
| D | 채팅·밸런스게임 | `app/chat/**`, `components/MessageBubble` |

- **`lib/mock/**`와 `lib/types.ts`는 A만 수정한다.** 데이터 모양·업무 규칙 변경이 필요하면 A에게 요청한다
- 두 곳이 겹친다: `app/profile/[id]`(C가 만들고 B가 차단·신고를 붙임), `app/chat/[id]`(D가 만들고 B가 신고 진입점을 붙임)
- 강제되는 순서는 **Phase 0 하나뿐**이다. 그 뒤로는 시드 데이터 덕분에 B·C·D가 동시에 시작한다

## 선행 프로젝트

`../소개팅 어플/`은 같은 저자의 이전 기획(경기랑, 연애 목적)이다. 이 프로젝트는 그 **방향 전환 후속작**이며, 무엇이 왜 바뀌었는지는 SPEC.md 부록 B에 정리돼 있다. 이전 SPEC의 결정(하트/패스 추천, 계열 수준 학과 표기 등)은 **여기서 대부분 뒤집혔으므로 그대로 가져오지 않는다.**

상위 폴더 `../CLAUDE.md`의 "단일 HTML 파일" 규칙은 이 프로젝트에 적용되지 않는다. 여기는 Next.js + Tailwind 다중 파일 프로젝트다. 다만 **색 팔레트는 상위 폴더의 파랑 계열을 이어받았다** — `app/globals.css`에 `--brand-900`(#1e3a8a) ~ `--brand-50`(#eff6ff)으로 정의돼 있고, Tailwind에서 `bg-brand-600` 같은 이름으로 쓴다. 새 화면도 이 토큰을 쓴다.

## Next.js 16 주의점

`create-next-app`이 만든 그대로가 아니라 몇 군데가 다르다.

- **미들웨어(`middleware.ts`/`proxy.ts`)가 없다.** 한때 Next 16의 새 이름인 `proxy.ts`로 접근 차단을 했지만, 서버가 없는 지금 구조에서는 미들웨어가 로그인 여부를 확인할 방법이 없어(세션이 아니라 브라우저 `localStorage`에 있으므로) 완전히 삭제했다. 접근 차단은 각 페이지의 `useEffect`가 한다
- `app/layout.tsx`에서 `LayoutProps<'/'>` 대신 `{ children: React.ReactNode }`를 쓴다. 전자는 빌드로 생성되는 전역 타입이라 `tsc --noEmit` 단독 실행에서 깨진다
- `metadata`를 export하는 `app/layout.tsx`는 서버 컴포넌트로 남아야 한다. 거기서 쓰는 상수(`APP_NAME` 등)를 클라이언트 컴포넌트(`'use client'`)가 같이 가져다 쓰면 Turbopack이 `layout.tsx` 전체를 클라이언트 번들에 넣으려다 "metadata는 서버 전용" 오류를 낸다 — 그런 상수는 `lib/appName.ts`처럼 별도 파일로 뺀다
- vitest 설정 파일은 `vitest.config.mts`다 (`.ts`면 CommonJS로 읽혀 경고가 난다)
- `next dev`가 이 파일 맨 아래에 `nextjs-agent-rules` 블록을 자동으로 다시 넣는다. 지워도 되살아나므로 그냥 둔다

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
