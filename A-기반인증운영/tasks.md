# A — 기반 · 인증 · 운영

**맡는 것:** 프로젝트 셋업, 데이터베이스 전부, 학교 이메일 인증, 관리자 화면, 배포
**담당 Phase:** 0 · 1 · 7, 그리고 Phase 9 배포 주도
**주로 건드리는 파일:** `supabase/**`, `lib/supabase/**`, `lib/types.ts`, `middleware.ts`, `app/login/**`, `app/onboarding`, `app/admin`, `app/suspended`

참고 문서: [../plan.md](../plan.md) · [../SPEC.md](../SPEC.md) · [../tasks.md](../tasks.md)

---

## 확정된 결정 (2026-08-19)

| 항목 | 결정 | 영향 |
|---|---|---|
| 서비스 범위 | **팀 내 시연용.** 실제 학생을 받지 않는다 | 커스텀 SMTP 불필요, 이용약관·개인정보처리방침 불필요 |
| 인증 방식 | **이메일 주소만 입력하면 로그인.** 코드도 비밀번호도 없음 | 메일을 한 통도 안 보낸다. 이메일 템플릿 수정 불필요. 도메인 검사는 DB 트리거로 유지 |
| 로그인 유지 | Supabase 기본 세션(리프레시 토큰). 비밀번호 없음 | 로그아웃 전까지 유지. SPEC `[확인 필요]` 7번 해결 |
| 학과 목록 | 임시 목록으로 진행, 나중에 교체 | `seed.sql`에 `[확인 필요]` 주석으로 표시해 둠 |
| 앱 이름 | 미정 (TBD) | `app/layout.tsx` 제목을 나중에 채운다 |

## 이미 만들어져 있는 것

아래 파일은 **작성이 끝났다. 새로 쓰지 말고 SQL Editor에 붙여넣어 실행만 하면 된다.**

- `supabase/migrations/001_schema.sql` — 테이블 9개 · 인덱스 · `profile_card` 타입 · `report_queue` 뷰
- `supabase/migrations/002_rls.sql` — RLS 정책 전체 + 권한 컬럼 보호 트리거
- `supabase/migrations/003_functions.sql` — RPC 11개
- `supabase/migrations/004_email_guard.sql` — 학교 이메일 트리거 + 막혔을 때의 대안
- `supabase/migrations/005_metrics.sql` — `metrics_summary` 뷰
- `supabase/seed.sql` — 태그 20개 · 질문 30개 · 더미 20명 · 신청 6건 · 대화방 1개(메시지 6개)

**Next.js 쪽도 이미 만들어져 있다** (빌드·테스트 통과 확인함).

- 프로젝트: Next.js 16.3.1 · React 19 · Tailwind 4 · vitest 4
- `lib/`: `types.ts` `validation.ts` `age.ts` `limits.ts` `departments.ts` `auth.ts` `supabase/{client,server}.ts`
- `proxy.ts`: 미인증·미프로필·정지 사용자 리다이렉트 (Next 16에서 `middleware.ts`가 `proxy.ts`로 바뀌었다)
- 화면: `app/page.tsx`(DB 연결 확인) · `app/login` · `app/onboarding` · `app/suspended`
- 서버 액션: `app/actions/auth.ts` `app/actions/profile.ts`
- 테스트 24개: `tests/{validation,age,limits}.test.ts` — 전부 통과

**plan.md에서 바뀐 점 두 가지** — 실행 전에 알아두면 좋다.

1. `report_queue`와 `metrics_summary` 뷰는 **RLS를 우회**한다(뷰는 소유자 권한으로 실행된다). 그래서 일반 사용자 접근을 막고 `admin_report_queue()` · `admin_metrics()` RPC를 통해서만 읽도록 바꿨다. 관리자 화면은 뷰가 아니라 이 두 함수를 호출한다
2. `profiles`에 **권한 컬럼 보호 트리거**를 추가했다. 이게 없으면 사용자가 자기 행을 `update`해서 스스로 `is_admin = true`로 만들 수 있다

## 시작 전에 알아야 할 것

**A는 첫날 혼자 앞서 나가야 한다.** Phase 0이 끝나기 전에는 B·C·D가 할 일이 없다.
Phase 0의 마지막 항목("팀 공지")을 마치는 순간부터 세 명이 동시에 움직인다. **여기가 팀 전체의 병목이므로 1일차에 무슨 일이 있어도 끝낸다.**

**나만 고치는 파일 (다른 사람은 손대지 않기로 약속돼 있다)**

- `supabase/migrations/**`, `supabase/seed.sql`
- `lib/types.ts`
- `middleware.ts`

B·C·D가 스키마 변경이 필요하면 나에게 요청한다. 동시에 고치면 반드시 충돌한다.

**내가 만들어서 남에게 넘기는 것**

| 넘기는 것 | 받는 사람 | 언제 |
|---|---|---|
| DB 스키마 · RPC 8개 · 더미 사용자 20명 | B · C · D 전원 | Phase 0 끝 |
| `lib/types.ts` 타입 정의 | B · C · D 전원 | Phase 0 끝 |
| `lib/supabase/client.ts` · `server.ts` | B · C · D 전원 | Phase 0 끝 |
| 로그인된 세션 (`auth.uid()`) | B · C · D 전원 | Phase 1 끝 |

**내가 남에게서 받는 것**

| 받는 것 | 준 사람 | 쓰는 곳 |
|---|---|---|
| `components/TagPicker.tsx` | B (Phase 2) | `app/onboarding` 태그 선택 |
| `components/Avatar.tsx` | B (Phase 2) | `app/admin` 신고 대상 표시 |

`TagPicker`가 늦어지면 온보딩에서 태그 선택만 빼고 먼저 완성한 뒤, 나중에 붙인다. **기다리지 않는다.**

---

## Phase 0 — 프로젝트 기반

**끝나면 보이는 것:** `npm run dev` 후 브라우저에 "친구만들기앱 · DB 연결됨 · 더미 사용자 20명"이 뜬다.

🔍 = 눈으로 확인 / 💾 = 커밋 지점

### 0-1 프로젝트 만들기 — **완료됨**

- [x] Next.js 16.3.1 프로젝트 생성 (TypeScript · Tailwind 4 · App Router · ESLint)
- [x] `.gitignore`에 `.env*` 포함 확인
- [x] `@supabase/supabase-js` `@supabase/ssr` 설치
- [x] `vitest` `@vitejs/plugin-react` `jsdom` `@testing-library/react` 설치
- [x] `vitest.config.mts` 작성, `npm test` · `npm run typecheck` 스크립트 추가
- [x] `npm run build` 통과, `npx vitest run` 24개 통과
- [ ] `git init` 후 💾 `chore: Next.js + Supabase + Vitest 초기 설정`

### 0-2 Supabase 프로젝트

**여기부터가 당신이 직접 해야 하는 일이다. 대시보드 로그인이 필요하다.**

- [ ] supabase.com에서 새 프로젝트 생성 (리전: Northeast Asia (Seoul))
- [ ] Project Settings → API에서 URL과 anon key 복사
- [ ] `.env.local.example`을 `.env.local`로 복사하고 값 두 개를 채운다
- [ ] **Authentication → Sign In / Providers → Email → "Confirm email" 끄기** ⚠️ 이걸 안 끄면 로그인이 안 된다
- [x] `lib/supabase/client.ts` · `lib/supabase/server.ts` 작성 완료
- [ ] 🔍 `npm run dev` → 첫 화면 아래 띠가 초록색 "DB 연결됨"으로 바뀌는지 확인 (지금은 노란색 ".env.local 이 없습니다")

### 0-3 스키마 — 파일은 이미 있다. 순서대로 실행만 한다

- [ ] `001_schema.sql`을 SQL Editor에 붙여넣어 실행, 오류 없이 끝나는지 확인 🔍
- [ ] Table Editor에서 테이블 9개 + 뷰 1개가 보이는지 확인 🔍
- [ ] `002_rls.sql` 실행
- [ ] `003_functions.sql` 실행 (`metrics_summary`가 아직 없어도 생성은 성공한다)
- [ ] `004_email_guard.sql` 실행
- [ ] 🔍 **트리거 동작 확인** — `insert into auth.users (id, email) values (gen_random_uuid(), 'x@gmail.com');` 실행 시 **오류가 나야** 정상. 행이 들어가면 트리거가 안 걸린 것이다
- [ ] 권한 오류로 트리거 생성이 막히면 → `004_email_guard.sql` 하단의 대안(Auth Hook) 검토
- [ ] `005_metrics.sql` 실행
- [ ] 🔍 RLS 확인 — 로그인하지 않은 상태에서 `supabase.from('profiles').select()` 호출 시 결과가 **0행**인지 확인
- [ ] 🔍 `blocks` 정책 확인 — 계정 하나로 로그인해 `select * from blocks`를 브라우저에서 호출했을 때 **내가 건 차단만** 나오는지 확인 (내가 차단당한 행이 보이면 SPEC 4.5 위반)
- [ ] SQL Editor에서 `alter publication supabase_realtime add table messages;` 실행 (D의 Phase 5에서 필요)
- [ ] Storage에 `avatars` 공개 버킷 생성 (B의 Phase 2에서 필요)
- [ ] `lib/types.ts`에 테이블 타입 정의 (`Profile`, `Tag`, `FriendRequest`, `Conversation`, `Message`, `Report`)
- [ ] 💾 `feat: DB 스키마 · RLS · RPC 함수`

### 0-4 시드 데이터 — **이게 있어야 B·C·D가 동시에 시작한다**

`supabase/seed.sql`은 이미 작성돼 있다. 실행하고 숫자만 확인한다.

- [ ] `seed.sql` 실행
- [ ] 🔍 `select count(*) from profiles;` → **20**
- [ ] 🔍 `select count(*) from interest_tags;` → **20**
- [ ] 🔍 `select count(*) from balance_questions;` → **30**
- [ ] 🔍 `select count(*) from friend_requests;` → **6** (대기 5 + 수락 1)
- [ ] 🔍 `select * from metrics_summary;` → 대화이어진관계수 **1**
- [ ] `auth.users` 삽입에서 오류가 나면 → 컬럼 구성이 Supabase 버전마다 다르므로 오류 메시지의 컬럼을 `seed.sql`의 insert에 추가한다
- [ ] `[확인 필요]` 학과명 20개를 경기대 실제 학과명으로 교체 (지금은 임시 목록)
- [ ] `app/page.tsx`가 프로필 수를 세어 "더미 사용자 20명"을 출력하게 수정
- [ ] `npm run dev` → 브라우저에 개수가 표시되는지 확인 🔍
- [ ] SQL Editor에서 `select * from search_profiles(null,19,30,null,null,10,0);` 결과가 나오는지 확인 🔍
- [ ] 💾 `feat: 시드 데이터 · DB 연결 확인 페이지`
- [ ] **팀 공지** — main에 push하고 B·C·D에게 "Phase 0 끝, 시작해도 됨" 알리기

---

## Phase 1 — 재학생 인증

**끝나면 보이는 것:** 본인 학교 메일로 6자리 코드를 받아 로그인하고, 프로필을 작성해 검색 화면까지 들어간다. 다른 도메인 메일은 거부된다.

### 1-1 코드 — **작성 완료. 확인만 남았다**

- [x] `lib/validation.ts` — `isSchoolEmail()` 외 4개. `a@kyonggi.ac.kr.evil.com` 같은 주소도 막는다
- [x] `app/login/page.tsx` — 이메일 한 칸 + "시작하기"
- [x] `app/actions/auth.ts` — `signInWithSchoolEmail()` (없으면 자동 가입 후 로그인) · `signOut()`
- [x] `app/onboarding/page.tsx` + `OnboardingForm.tsx` — 닉네임·출생연도·학과·성별·태그·한 줄 소개
- [x] `app/actions/profile.ts` — `createProfile()`
- [x] `proxy.ts` — 미인증 → `/login`, 프로필 없음 → `/onboarding`, 정지 중 → `/suspended`
- [x] `tests/validation.test.ts` 15개 통과

### 1-2 눈으로 확인 (Supabase 연결 후)

- [ ] 🔍 `test@gmail.com` 입력 → "경기대학교 이메일(@kyonggi.ac.kr)만 사용할 수 있습니다"
- [ ] 🔍 본인 학교 메일 입력 → **메일 없이 바로** `/onboarding`으로 넘어간다
- [ ] 🔍 "Confirm email"을 안 껐으면 여기서 안내 문구가 뜬다 → 대시보드에서 끄고 재시도
- [ ] 🔍 프로필 작성 완료 → `profiles`에 내 행이 생긴다
- [ ] 🔍 태그를 5개 고른 뒤 6개째 클릭 → "최대 5개까지 고를 수 있어요"가 뜨고 선택되지 않는다
- [ ] 🔍 로그아웃 후 주소창에 `/onboarding` 직접 입력 → `/login`으로 튕긴다
- [ ] 🔍 같은 이메일로 다시 로그인 → 온보딩을 건너뛰고 바로 넘어간다
- [ ] 💾 `feat: 학교 이메일 로그인 · 온보딩 · 접근 차단`

### 1-3 B의 컴포넌트로 교체

- [ ] `OnboardingForm.tsx`의 태그 선택 부분은 **임시 구현**이다. B의 `components/TagPicker.tsx`가 나오면 교체한다 (같은 컴포넌트를 두 개 두지 않는다)

---

## Phase 7 — 관리자 화면

**끝나면 보이는 것:** 관리자 계정으로 `/admin`에 들어가면 신고 목록이 보이고, 정지 버튼을 누르면 그 사용자가 다음 로그인 때 정지 안내 화면을 본다.

**시작 조건:** B의 Phase 6(신고 기능)이 끝나 `reports` 테이블에 실제 데이터가 쌓여 있으면 가장 좋다. 안 끝났으면 SQL로 직접 신고 행 3개를 넣고 진행한다.

### 7-1~7-4 코드 — **작성 완료. Supabase 연결 후 확인만 남았다**

- [x] `app/actions/admin.ts` — `resolveReport()`, `admin_resolve_report` RPC 호출
- [x] `app/admin/page.tsx` — `getMyProfile().is_admin` 아니면 `notFound()`. `admin_report_queue()` · `admin_metrics()` 병렬 호출
- [x] `app/admin/ReportRow.tsx` — 신고 한 줄(닉네임·학과·신고자 수·사유 태그) + 기각/경고/정지(일수 입력) 버튼
- [x] 지표 카드 6개, "대화 이어진 관계 수"를 강조 배치 (SPEC 8장 주지표)
- [x] RPC 세 곳 모두 `is_admin` 재확인 코드 있음 (`003_functions.sql` 273·303·339행) — 화면 숨김만으로 막지 않음
- [x] `npm run build` 통과, `/admin` 라우트 생성 확인
- [ ] 🔍 아래 항목은 Supabase 연결 + 계정 하나를 관리자로 지정한 뒤 확인

### 7-5 눈으로 확인 (Supabase 연결 후)

- [ ] SQL Editor에서 팀원 한 명을 `update profiles set is_admin = true where id = '...'`
- [ ] 🔍 일반 계정으로 `/admin` 주소 직접 입력 → 막힌다 (404)
- [ ] 🔍 관리자 계정으로 `/admin` 접속 → 화면이 열리고 지표 카드가 보인다
- [ ] B의 Phase 6이 끝나기 전이면 SQL로 신고 3건을 직접 넣어 확인: 서로 다른 계정 3개로 `select report_user('대상id','abuse')` 실행
- [ ] 🔍 신고 3건 쌓인 사용자가 목록에 뜬다. 신고 2건인 사용자는 안 뜬다 (임계치 3)
- [ ] 🔍 `정지 30일` 클릭 → 해당 계정 로그인 시 `/suspended`가 뜨고 해제 예정일이 보인다
- [ ] 🔍 정지된 계정이 검색 결과에서 사라진다 (C의 Phase 3 완성 후)
- [ ] 🔍 `기각` 클릭 → 목록에서 내려간다. `경고` 클릭 → 정지되지 않고 상태만 바뀐다
- [ ] 💾 `feat: 관리자 화면 · 신고 처리 · 지표 (검증 완료)`

---

## 절대 어기면 안 되는 것

- **`004_email_guard.sql` 트리거를 빼먹지 않는다.** 없으면 아무 이메일로나 가입된다 (SPEC 4.1)
- **`blocks`·`reports` RLS를 `using (true)`로 열지 않는다.** 개발자 도구에서 "누가 나를 차단·신고했는지"가 그대로 보인다 (SPEC 4.5)
- **검토 대기 중이라고 자동 정지하지 않는다.** 관리자가 누르기 전까지 그 사람은 계속 정상 노출된다. 이걸 어기면 담합 신고로 무고한 사용자가 쫓겨난다 (SPEC 4.5)
- **`/admin` 접근 제한을 화면 숨김으로만 처리하지 않는다.** RPC 함수 안에서도 `is_admin`을 다시 확인한다

---

Phase 7까지 끝났으면 → [../tasks.md](../tasks.md)의 **Phase 9 통합·배포**로 (내가 주도한다)
