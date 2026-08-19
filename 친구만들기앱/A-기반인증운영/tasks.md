# A — 기반 · 인증 · 운영

**맡는 것:** 프로젝트 셋업, 데이터베이스 전부, 학교 이메일 인증, 관리자 화면, 배포
**담당 Phase:** 0 · 1 · 7, 그리고 Phase 9 배포 주도
**주로 건드리는 파일:** `supabase/**`, `lib/supabase/**`, `lib/types.ts`, `middleware.ts`, `app/login/**`, `app/onboarding`, `app/admin`, `app/suspended`

참고 문서: [../plan.md](../plan.md) · [../SPEC.md](../SPEC.md) · [../tasks.md](../tasks.md)

---

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

### 0-1 프로젝트 만들기

- [ ] `친구만들기앱` 폴더에서 `git init` 실행
- [ ] `npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*"` 실행
- [ ] `npm run dev` → `http://localhost:3000`에 기본 페이지가 뜨는지 확인 🔍
- [ ] `.gitignore`에 `.env.local`이 들어 있는지 확인 🔍 (없으면 추가)
- [ ] `npm i @supabase/supabase-js @supabase/ssr` 설치
- [ ] `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react` 설치
- [ ] `vitest.config.ts` 작성, `package.json`에 `"test": "vitest run"` 추가
- [ ] 💾 `chore: Next.js + Supabase + Vitest 초기 설정`

### 0-2 Supabase 프로젝트

- [ ] supabase.com에서 새 프로젝트 생성 (리전: Northeast Asia (Seoul))
- [ ] Project Settings → API에서 URL과 anon key 복사
- [ ] `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 저장
- [ ] `.env.local.example`을 값 없이 만들어 커밋 (팀원이 뭘 채워야 하는지 알 수 있게)
- [ ] `lib/supabase/client.ts` 작성 — `createBrowserClient` 사용
- [ ] `lib/supabase/server.ts` 작성 — `createServerClient` + 쿠키 연동

### 0-3 스키마

SQL 전문은 [../plan.md](../plan.md)의 "데이터베이스 설계"·"행 수준 보안"·"업무 규칙 함수"·"성공 지표 측정" 절에 있다. 그대로 붙여넣는다.

- [ ] `supabase/migrations/001_schema.sql` 작성 — plan.md의 SQL 전문을 그대로 붙여넣는다
- [ ] SQL Editor에서 `001_schema.sql` 실행, 오류 없이 끝나는지 확인 🔍
- [ ] Table Editor에서 테이블 9개 + 뷰 1개가 보이는지 확인 🔍
- [ ] `supabase/migrations/002_rls.sql` 작성 — plan.md "행 수준 보안"의 SQL 전문을 그대로 붙여넣고 실행
- [ ] 🔍 RLS 확인 — 로그인하지 않은 상태에서 `supabase.from('profiles').select()` 호출 시 결과가 **0행**인지 확인
- [ ] 🔍 `blocks` 정책 확인 — 계정 A로 로그인해 `select * from blocks`를 브라우저에서 호출했을 때 **A가 건 차단만** 나오는지 확인 (내가 차단당한 행이 보이면 SPEC 4.5 위반)
- [ ] `supabase/migrations/003_functions.sql` 작성 — plan.md 표의 RPC 8개 + `profile_card` 타입
- [ ] `supabase/migrations/004_email_guard.sql` 작성 및 실행 (학교 이메일 트리거)
- [ ] `supabase/migrations/005_metrics.sql` 작성 및 실행 (`metrics_summary` 뷰)
- [ ] SQL Editor에서 `alter publication supabase_realtime add table messages;` 실행 (D의 Phase 5에서 필요)
- [ ] Storage에 `avatars` 공개 버킷 생성 (B의 Phase 2에서 필요)
- [ ] `lib/types.ts`에 테이블 타입 정의 (`Profile`, `Tag`, `FriendRequest`, `Conversation`, `Message`, `Report`)
- [ ] 💾 `feat: DB 스키마 · RLS · RPC 함수`

### 0-4 시드 데이터 — **이게 있어야 B·C·D가 동시에 시작한다**

- [ ] `supabase/seed.sql`에 관심사 태그 20개 삽입 (SPEC 4.2 제안 목록)
- [ ] 밸런스게임 질문 30개 삽입 (정치·종교·외모·연애 경험 관련 질문 제외)
- [ ] 더미 사용자 20명 삽입 — 성별·학과·나이·태그를 골고루 섞는다
- [ ] 더미 친구 신청 5건, 수락된 대화방 1개, 그 안에 메시지 6개 삽입
- [ ] `seed.sql` 실행 후 `select count(*) from profiles;` → 20 확인 🔍
- [ ] `app/page.tsx`가 프로필 수를 세어 "더미 사용자 20명"을 출력하게 수정
- [ ] `npm run dev` → 브라우저에 개수가 표시되는지 확인 🔍
- [ ] SQL Editor에서 `select * from search_profiles(null,19,30,null,null,10,0);` 결과가 나오는지 확인 🔍
- [ ] 💾 `feat: 시드 데이터 · DB 연결 확인 페이지`
- [ ] **팀 공지** — main에 push하고 B·C·D에게 "Phase 0 끝, 시작해도 됨" 알리기

---

## Phase 1 — 재학생 인증

**끝나면 보이는 것:** 본인 학교 메일로 6자리 코드를 받아 로그인하고, 프로필을 작성해 검색 화면까지 들어간다. 다른 도메인 메일은 거부된다.

### 1-1 검증 함수 (테스트 먼저)

- [ ] `tests/validation.test.ts` 작성 — `isSchoolEmail('a@kyonggi.ac.kr')` → true, `isSchoolEmail('a@gmail.com')` → false, `isSchoolEmail('a@kyonggi.ac.kr.evil.com')` → **false**
- [ ] `npx vitest run` → 실패 확인 (함수 없음) 🔍
- [ ] `lib/validation.ts`에 `isSchoolEmail(email: string): boolean` 구현
- [ ] `npx vitest run` → 통과 확인 🔍
- [ ] 💾 `feat: 학교 이메일 검증 함수`

### 1-2 로그인 화면

- [ ] `app/login/page.tsx` — 이메일 입력창 + "인증코드 받기" 버튼
- [ ] 제출 시 `isSchoolEmail`로 먼저 거르고, 통과하면 `signInWithOtp({ email })` 호출
- [ ] 성공 시 `/login/verify?email=...`로 이동
- [ ] 🔍 `test@gmail.com` 입력 → "경기대학교 이메일(@kyonggi.ac.kr)만 가입할 수 있습니다"
- [ ] 🔍 본인 학교 메일 입력 → 실제 메일함에 6자리 코드 도착
- [ ] 💾 `feat: 이메일 입력 로그인 화면`

### 1-3 코드 확인 화면

- [ ] `app/login/verify/page.tsx` — 6자리 입력창 + "확인" 버튼
- [ ] `verifyOtp({ email, token, type: 'email' })` 호출
- [ ] 성공 후 `profiles`에 내 행이 있는지 조회 → 있으면 `/search`, 없으면 `/onboarding`
- [ ] 실패 시 "인증코드가 올바르지 않습니다" 표시
- [ ] 🔍 틀린 코드 → 오류 문구가 뜨고 화면이 안 넘어간다
- [ ] 🔍 맞는 코드 → `/onboarding`으로 이동
- [ ] 💾 `feat: 인증코드 확인 화면`

### 1-4 온보딩 + 접근 차단

- [ ] `app/onboarding/page.tsx` — 닉네임·출생연도·학과·성별·한 줄 소개 입력 (태그 선택은 B의 `TagPicker`가 준비되면 붙인다)
- [ ] `app/actions/profile.ts`의 `createProfile()` 서버 액션으로 `profiles` insert
- [ ] `middleware.ts` 작성 — 세션 없음 → `/login`, 프로필 없음 → `/onboarding`, 정지 중 → `/suspended`
- [ ] 예외 경로 목록에 `/login`, `/login/verify`, `/suspended` 추가
- [ ] 🔍 프로필 작성 완료 → `/search` 이동, Supabase `profiles`에 내 행 생성
- [ ] 🔍 로그아웃 후 주소창에 `/search` 직접 입력 → `/login`으로 튕김
- [ ] 🔍 로그인만 하고 프로필 없는 상태로 `/search` 시도 → `/onboarding`으로 튕김
- [ ] 💾 `feat: 온보딩 화면 · 미인증 접근 차단`
- [ ] B의 `TagPicker`가 나왔으면 온보딩에 붙이고 🔍 확인

---

## Phase 7 — 관리자 화면

**끝나면 보이는 것:** 관리자 계정으로 `/admin`에 들어가면 신고 목록이 보이고, 정지 버튼을 누르면 그 사용자가 다음 로그인 때 정지 안내 화면을 본다.

**시작 조건:** B의 Phase 6(신고 기능)이 끝나 `reports` 테이블에 실제 데이터가 쌓여 있으면 가장 좋다. 안 끝났으면 SQL로 직접 신고 행 3개를 넣고 진행한다.

### 7-1 권한

- [ ] `admin_resolve_report` RPC 안에서 `is_admin` 재확인하는 코드가 있는지 점검 (없으면 추가)
- [ ] `app/admin/page.tsx` 진입 시 서버에서 `is_admin` 확인, 아니면 404
- [ ] 🔍 일반 계정으로 `/admin` 주소 직접 입력 → 막힌다
- [ ] SQL Editor에서 팀원 한 명을 `update profiles set is_admin = true where id = '...'`
- [ ] 🔍 그 계정으로 `/admin` 접속 → 화면이 열린다
- [ ] 💾 `feat: 관리자 권한 확인`

### 7-2 신고 목록

- [ ] `report_queue` 뷰 + `reports` 조인해 목록 조회
- [ ] 각 행: 신고 대상 프로필 / 서로 다른 신고자 수 / 최근 신고일 / 사유 목록
- [ ] **신고자 수 많은 순** 정렬
- [ ] 신고 상세 펼치기 (사유별 개수, 상세 내용)
- [ ] 🔍 신고 3건 쌓인 사용자가 목록 맨 위에 온다
- [ ] 🔍 신고 2건인 사용자는 목록에 안 나온다 (임계치 3)
- [ ] 💾 `feat: 관리자 신고 목록`

### 7-3 처리와 정지

- [ ] `기각` / `경고` / `정지` 버튼 추가, 정지는 일수 입력(기본 30)
- [ ] `adminResolve()` 서버 액션 → `admin_resolve_report` RPC 호출
- [ ] `app/suspended/page.tsx` — 정지 사유 · 해제 예정일 · 문의 이메일 주소 표시
- [ ] `middleware.ts`에 `suspended_until > now()` 검사가 들어 있는지 확인
- [ ] 🔍 `정지 30일` 클릭 → 해당 계정 로그인 시 `/suspended`가 뜨고 해제 예정일이 보인다
- [ ] 🔍 정지된 계정이 검색 결과에서 사라진다
- [ ] 🔍 정지된 계정이 친구 신청을 시도하면 막힌다
- [ ] 🔍 `기각` 클릭 → 목록에서 내려간다
- [ ] 🔍 `경고` 클릭 → 정지되지 않고 상태만 바뀐다
- [ ] 💾 `feat: 신고 처리 · 정지 · 정지 안내 화면`

### 7-4 성공 지표 (SPEC 8장)

- [ ] `/admin` 화면 맨 위에 `metrics_summary` 뷰의 6개 숫자를 카드로 표시
- [ ] "대화 이어진 관계 수"를 가장 크게 배치 (주지표)
- [ ] 🔍 시드 데이터 기준으로 숫자가 실제와 맞는지 SQL로 대조
- [ ] 💾 `feat: 관리자 화면 지표 요약`

---

## 절대 어기면 안 되는 것

- **`004_email_guard.sql` 트리거를 빼먹지 않는다.** 없으면 아무 이메일로나 가입된다 (SPEC 4.1)
- **`blocks`·`reports` RLS를 `using (true)`로 열지 않는다.** 개발자 도구에서 "누가 나를 차단·신고했는지"가 그대로 보인다 (SPEC 4.5)
- **검토 대기 중이라고 자동 정지하지 않는다.** 관리자가 누르기 전까지 그 사람은 계속 정상 노출된다. 이걸 어기면 담합 신고로 무고한 사용자가 쫓겨난다 (SPEC 4.5)
- **`/admin` 접근 제한을 화면 숨김으로만 처리하지 않는다.** RPC 함수 안에서도 `is_admin`을 다시 확인한다

---

Phase 7까지 끝났으면 → [../tasks.md](../tasks.md)의 **Phase 9 통합·배포**로 (내가 주도한다)
