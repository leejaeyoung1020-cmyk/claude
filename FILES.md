# 파일 지도

지금까지 만들어진 파일이 뭘 하는지 한눈에 보려고 만든 문서다. 코드를 옮기지는 않았다 — 구조는 그대로 두고 지도만 그렸다.

**상태 표시**

- ✅ 검증됨 — `npm run build`/`npm test`로 확인했거나, 눈으로 직접 확인한 것
- 🟡 미검증 — 코드는 있지만 Supabase 연결 전이라 실제로 눌러보지 못한 것
- 🔧 임시 — 동작은 하지만 팀원이 만들 진짜 컴포넌트로 교체될 자리
- ⬜ 없음 — 아직 코드가 없는 것 (트랙 체크리스트 참고)

---

## 1. 문서 5개 — 역할이 겹치지 않게 나뉘어 있다

| 파일 | 무엇을 담당하나 | 언제 연다 |
|---|---|---|
| [SPEC.md](SPEC.md) | **무엇을 왜** 만드는지. 기획 결정, `[확인 필요]` 20건, 부록 | 기능이 헷갈릴 때 |
| [plan.md](plan.md) | **어떻게** 만드는지. DB 스키마 SQL 전문, RPC 시그니처, Phase별 설계 이유 | 코드를 새로 짤 때 |
| [tasks.md](tasks.md) | 전체 진행 현황표, 트랙 간 의존 관계, Phase 9(통합) | 지금 뭐가 끝났는지 볼 때 |
| [README.md](README.md) | 처음 클론한 사람이 3분 안에 `npm run dev`까지 가는 법 | 새 팀원이 왔을 때 |
| [CLAUDE.md](CLAUDE.md) | AI 어시스턴트용 — 지켜야 할 규칙 요약, Next 16 함정 | AI에게 작업시킬 때 |

**겹치지 않는 이유**: SPEC은 "왜", plan은 "어떻게 설계했나", tasks는 "지금 어디까지 됐나"로 시점이 다르다. 같은 내용을 두 곳에 쓰지 않으려고 tasks.md는 자기 파일 내용을 복사하지 않고 트랙별 tasks.md를 링크만 한다.

## 2. 트랙별 체크리스트 4개

각 파일 안에 "이미 만들어져 있는 것 / 시작 전 알아야 할 것 / Phase별 체크박스 / 절대 어기면 안 되는 것"이 들어 있다.

| 폴더 | 담당 | 지금 상태 |
|---|---|---|
| [A-기반인증운영/](A-기반인증운영/tasks.md) | 기반·인증·관리자 | Phase 0·1·7 코드 완료, Supabase 연결 대기 |
| [B-프로필안전/](B-프로필안전/tasks.md) | 프로필·차단·신고 | ⬜ 시작 전 |
| [C-검색신청/](C-검색신청/tasks.md) | 검색·친구 신청 | ⬜ 시작 전 |
| [D-채팅게임/](D-채팅게임/tasks.md) | 채팅·밸런스게임 | ⬜ 시작 전 |

이 폴더들 안에는 코드가 없다. **체크리스트 전용 폴더**다. 실제 코드는 전부 `app/`·`lib/`에 있다.

## 3. 데이터베이스 — `supabase/`

Next.js 코드보다 먼저 실행돼야 하는 것들. **파일 이름의 앞 숫자가 실행 순서다.**

| 파일 | 상태 | 내용 |
|---|---|---|
| `migrations/001_schema.sql` | ✅ 작성 완료 · 🟡 미실행 | 테이블 9개, `profile_card` 타입, `report_queue` 뷰 |
| `migrations/002_rls.sql` | ✅ 작성 완료 · 🟡 미실행 | 행 수준 보안. `blocks`·`reports`는 본인 것만 읽힌다 |
| `migrations/003_functions.sql` | ✅ 작성 완료 · 🟡 미실행 | 업무 규칙 RPC 11개. 하루 신청 상한·신고 임계치가 전부 여기 있다 |
| `migrations/004_email_guard.sql` | ✅ 작성 완료 · 🟡 미실행 | `@kyonggi.ac.kr` 도메인 강제 트리거 |
| `migrations/005_metrics.sql` | ✅ 작성 완료 · 🟡 미실행 | 성공 지표 뷰 (양쪽 3턴 이상 관계 수) |
| `seed.sql` | ✅ 작성 완료 · 🟡 미실행 | 태그 20개·질문 30개·더미 사용자 20명·신청 6건 |

**"미실행"인 이유**: 이 SQL들은 당신의 Supabase 프로젝트에 로그인해서 SQL Editor에 붙여넣어야 한다. 파일로 존재하는 것과 DB에 반영된 것은 다르다. [A-기반인증운영/tasks.md](A-기반인증운영/tasks.md)의 0-2·0-3·0-4가 이 실행 절차다.

## 4. 공용 로직 — `lib/`

화면 여러 개가 같이 쓰는 규칙. **여기 있는 값을 화면에서 다시 계산하면 버그다** (한 곳에서만 판정하기로 한 규칙).

| 파일 | 상태 | 내용 |
|---|---|---|
| `types.ts` | ✅ | DB 테이블·RPC 반환값의 TypeScript 타입. A만 수정 |
| `validation.ts` | ✅ 테스트 15개 | 학교 이메일·인사말·닉네임·태그 개수 검증 |
| `age.ts` | ✅ 테스트 4개 | 출생연도 → 나이. 나이는 DB에 저장 안 하고 매번 계산 |
| `limits.ts` | ✅ 테스트 5개 | 하루 신청 상한(5) 표시용 계산. **판정은 DB가 한다** |
| `departments.ts` | 🔧 임시 목록 | 경기대 실제 학과명으로 교체 필요 |
| `auth.ts` | ✅ · 🟡 미검증 | 시연용 자동 로그인, 내 프로필 조회, 정지 여부 판정 |
| `supabase/client.ts` | ✅ | 브라우저용 Supabase 클라이언트 |
| `supabase/server.ts` | ✅ | 서버 컴포넌트·서버 액션용 클라이언트 |

## 5. 화면 — `app/`

Next.js가 URL 경로로 그대로 읽는 폴더라 이 구조는 임의로 바꿀 수 없다.

```
app/
├─ page.tsx              ✅        랜딩 · DB 연결 상태 표시
├─ layout.tsx             ✅        전체 틀, 앱 이름(TBD)
├─ globals.css            ✅        파랑 계열 색상 토큰
├─ login/
│  └─ page.tsx            🟡        이메일 입력 로그인
├─ onboarding/
│  ├─ page.tsx            🟡        프로필 최초 작성 화면 뼈대
│  └─ OnboardingForm.tsx  🟡🔧      실제 폼. 태그 선택 부분은 B의 TagPicker로 교체 예정
├─ suspended/
│  └─ page.tsx            🟡        정지 안내
├─ admin/
│  ├─ page.tsx            🟡        신고 목록 + 지표 카드
│  └─ ReportRow.tsx       🟡🔧      신고 한 줄. 아바타는 B의 Avatar로 교체 예정
└─ actions/               서버 액션 (RPC를 호출하는 다리 역할)
   ├─ auth.ts             🟡        로그인·로그아웃
   ├─ profile.ts          🟡        프로필 생성
   └─ admin.ts            🟡        신고 처리
```

**아직 없는 화면** (B·C·D 담당, 각 트랙 tasks.md 참고): `app/me`(내 프로필 편집) · `app/search` · `app/profile/[id]` · `app/requests` · `app/chat/**`

## 6. 테스트 — `tests/`

| 파일 | 개수 | 검사 대상 |
|---|---|---|
| `validation.test.ts` | 15 | 이메일 도메인, 인사말·닉네임·태그 개수 |
| `age.test.ts` | 4 | 출생연도 → 나이 변환, 나이 범위 뒤집기 |
| `limits.test.ts` | 5 | 하루 신청 상한 계산의 경계값 |

`lib/`의 함수와 1:1로 대응한다. **DB나 화면을 테스트하지 않는다** — 그건 각 Phase의 🔍 눈 확인 항목이 담당한다.

## 7. 프로젝트 설정

한 번 정해지면 거의 안 바뀌는 파일들. `package.json`(의존성)·`tsconfig.json`·`eslint.config.mjs`·`postcss.config.mjs`·`next.config.ts`·`vitest.config.mts`·`.gitignore`·`.env.local.example`·`proxy.ts`(접근 차단, Next 16에서 `middleware.ts`의 새 이름).

---

## 지금 뭘 보면 되나

- **"내 트랙에서 뭘 하면 되지?"** → 자기 폴더의 `tasks.md`
- **"이 화면 코드가 왜 이렇게 짜였지?"** → `plan.md`에서 해당 Phase 절
- **"이 기능이 왜 이 규칙을 따르지?"** → `SPEC.md`에서 해당 조항
- **"이 파일이 뭐 하는 거지?"** → 이 문서(FILES.md)

이 문서는 파일이 새로 생기거나 상태가 바뀔 때(🟡 → ✅) 함께 갱신한다.
