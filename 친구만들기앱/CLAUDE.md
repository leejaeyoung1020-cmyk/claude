# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 현재 상태

**Phase 0의 코드 쪽은 끝났고, Supabase 연결이 남았다.**

- 있는 것: Next.js 16 프로젝트, 마이그레이션 SQL 5개, `seed.sql`, 로그인·온보딩·정지 안내 화면, 단위 테스트 24개(통과), `npm run build` 통과
- 없는 것: **`.env.local`**. Supabase 프로젝트를 만들고 URL·anon key를 넣어야 DB가 붙는다. 그 전까지 첫 화면에 "`.env.local` 이 없습니다"가 뜨고, 로그인은 동작하지 않는다
- SQL 5개와 `seed.sql`은 **아직 실행되지 않았다.** Supabase 대시보드 SQL Editor에 001→002→003→004→005→seed 순서로 붙여넣어야 한다

다음 작업은 [A-기반인증운영/tasks.md](A-기반인증운영/tasks.md)의 Phase 0-2·0-3·0-4다.

## 로그인 방식 — 시연 전용 지름길

**`@kyonggi.ac.kr` 이메일 한 칸만 입력하면 로그인된다.** 인증코드도 비밀번호도 없다.

내부적으로는 이메일에서 만들어낸 고정 비밀번호(`lib/auth.ts`의 `demoPassword`)로 Supabase 계정을 자동 생성·로그인시킨다. 그래서 세션·RLS·`auth.uid()`는 전부 진짜로 동작한다.

**이메일 주소만 알면 그 사람으로 로그인된다.** v1이 팀 내 시연 범위라서 택한 방식이고, 실제 학생을 받기로 하면 반드시 이메일 인증코드(OTP)로 되돌려야 한다. 도메인 검사는 이 방식에서도 DB 트리거(`004_email_guard.sql`)로 유지된다.

Supabase 대시보드에서 **Authentication → Email의 "Confirm email"을 꺼야** 이 흐름이 동작한다.

## 문서 구조와 읽는 순서

| 문서 | 내용 | 언제 읽나 |
|---|---|---|
| [SPEC.md](SPEC.md) | 기획서. 무엇을 왜 만드는지, 확정된 결정 15건, 미해결 20건 | 항상 먼저 |
| [plan.md](plan.md) | 구현 계획. DB 스키마 SQL 전문, RLS 정책, RPC 목록, Phase 0~9 | 코드 쓰기 전 |
| [tasks.md](tasks.md) | 전체 인덱스. 공통 규칙, 일정, 트랙 간 의존 관계 | 작업 시작 전 |
| `{A,B,C,D}-*/tasks.md` | 담당자별 체크리스트 | 자기 트랙 작업 중 |

**DB 스키마·RLS 정책·RPC 함수의 SQL 전문은 plan.md 안에 있다.** 새로 설계하지 말고 거기서 가져다 쓴다.

## 명령어

```bash
npm run dev                            # 개발 서버 (localhost:3000)
npm run build                          # 프로덕션 빌드
npm test                               # 전체 테스트 (vitest)
npx vitest run tests/limits.test.ts    # 단일 테스트 파일
npm run typecheck                      # 타입 검사
```

`npx tsc --noEmit`을 `next build` 없이 처음 돌리면 Next가 만드는 전역 타입이 아직 없어 실패할 수 있다. 그럴 때는 `npm run build`를 한 번 돌린 뒤 다시 검사한다.

마이그레이션은 CLI가 아니라 **Supabase 대시보드 SQL Editor에 직접 붙여넣어 실행**한다. `supabase/migrations/*.sql`은 실행 기록 겸 형상 관리용이다.

## 아키텍처의 핵심 판단

**업무 규칙은 전부 Postgres 함수(RPC)에 있고, 화면 코드에는 없다.**

하루 신청 상한 5건, 차단 양방향 반영, 신고 임계치 3명, 정지 여부 판정 — 이 규칙들은 `supabase/migrations/003_functions.sql`의 `security definer` 함수 안에만 구현한다. Next.js 쪽은 RPC를 호출하고 오류 메시지를 그대로 보여주기만 한다.

이렇게 한 이유는 4명이 서로 다른 화면을 동시에 만들기 때문이다. 규칙을 화면마다 구현하면 네 벌이 생기고 서로 어긋난다. **화면 코드에서 상한을 세거나 차단 여부를 판단하는 코드를 발견하면 그것은 버그다.**

주요 RPC: `search_profiles` · `send_friend_request` · `respond_friend_request` · `block_user` / `unblock_user` · `report_user` · `mark_conversation_read` · `admin_resolve_report` (시그니처는 plan.md 참고)

**RLS는 보안 장치가 아니라 기능 요구사항이다.** `blocks`와 `reports`의 select 정책을 `using (true)`로 열면 개발자 도구에서 "누가 나를 차단·신고했는지"가 그대로 보이고, SPEC 4.5의 "상대에게 알리지 않는다"가 무너진다.

## 코드가 어기면 안 되는 것

SPEC에서 확정된 것들이다. 편의상 바꾸고 싶어지는 것만 추렸다.

| 규칙 | 어기면 |
|---|---|
| `@kyonggi.ac.kr` 이메일만 가입 (`auth.users` 트리거로 강제) | 아무나 들어옴 |
| 인증 안 한 사용자는 어떤 화면도 못 봄 (`proxy.ts`) | SPEC 4.1 위반 |
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
| A | 기반·인증·운영 | `supabase/**`, `lib/supabase/**`, `lib/types.ts`, `proxy.ts`, `app/login/**`, `app/onboarding`, `app/admin` |
| B | 프로필·안전장치 | `app/me`, `components/TagPicker` `TagChip` `Avatar` `ReportDialog` |
| C | 검색·친구 신청 | `app/search`, `app/profile/[id]`, `app/requests`, `components/ProfileCard` |
| D | 채팅·밸런스게임 | `app/chat/**`, `components/MessageBubble` |

- **`supabase/**`와 `lib/types.ts`는 A만 수정한다.** 스키마 변경이 필요하면 A에게 요청한다
- 두 곳이 겹친다: `app/profile/[id]`(C가 만들고 B가 차단·신고를 붙임), `app/chat/[id]`(D가 만들고 B가 신고 진입점을 붙임)
- 강제되는 순서는 **Phase 0 하나뿐**이다. 그 뒤로는 시드 데이터 덕분에 B·C·D가 동시에 시작한다

## 선행 프로젝트

`../소개팅 어플/`은 같은 저자의 이전 기획(경기랑, 연애 목적)이다. 이 프로젝트는 그 **방향 전환 후속작**이며, 무엇이 왜 바뀌었는지는 SPEC.md 부록 B에 정리돼 있다. 이전 SPEC의 결정(하트/패스 추천, 계열 수준 학과 표기 등)은 **여기서 대부분 뒤집혔으므로 그대로 가져오지 않는다.**

상위 폴더 `../CLAUDE.md`의 "단일 HTML 파일" 규칙은 이 프로젝트에 적용되지 않는다. 여기는 Next.js + Tailwind 다중 파일 프로젝트다. 다만 **색 팔레트는 상위 폴더의 파랑 계열을 이어받았다** — `app/globals.css`에 `--brand-900`(#1e3a8a) ~ `--brand-50`(#eff6ff)으로 정의돼 있고, Tailwind에서 `bg-brand-600` 같은 이름으로 쓴다. 새 화면도 이 토큰을 쓴다.

## Next.js 16 주의점

`create-next-app`이 만든 그대로가 아니라 몇 군데가 다르다.

- **`middleware.ts`가 아니라 `proxy.ts`다.** Next 16에서 이름이 바뀌었고, 내보내는 함수 이름도 `proxy`다. plan.md와 tasks.md의 "middleware.ts"는 이 파일을 가리킨다
- `app/layout.tsx`에서 `LayoutProps<'/'>` 대신 `{ children: React.ReactNode }`를 쓴다. 전자는 빌드로 생성되는 전역 타입이라 `tsc --noEmit` 단독 실행에서 깨진다
- vitest 설정 파일은 `vitest.config.mts`다 (`.ts`면 CommonJS로 읽혀 경고가 난다)
- `next dev`가 이 파일 맨 아래에 `nextjs-agent-rules` 블록을 자동으로 다시 넣는다. 지워도 되살아나므로 그냥 둔다

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
