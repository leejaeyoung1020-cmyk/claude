# 파일 지도

지금까지 만들어진 파일이 뭘 하는지 한눈에 보려고 만든 문서다.

**상태 표시**

- ✅ 검증됨 — `npm run build`/`npm test`로 확인했거나, 눈으로 직접 확인한 것
- 🟡 미검증 — 코드는 있지만 실제 화면에서 눌러보며 확인하지는 못한 것
- 🔧 임시 — 동작은 하지만 팀원이 만들 진짜 컴포넌트로 교체될 자리
- ⬜ 없음 — 아직 코드가 없는 것 (트랙 체크리스트 참고)

---

## 0. 아키텍처 한 줄 요약 (2026-08-19 결정 — Supabase 전면 제거)

**서버가 없다.** 처음엔 Supabase(DB·인증·RLS·RPC)로 만들었다가, 시뮬레이션만 돌리는 걸로 결정이 바뀌면서 `supabase/`·`lib/supabase/`·`proxy.ts`·`app/actions/*.ts`를 전부 지웠다. 지금은 Next.js 전체가 `'use client'`이고, 데이터는 브라우저 `localStorage`/`sessionStorage`에만 있다. `lib/mock/`이 예전 Supabase 자리를 대신한다.

## 1. 문서 5개 — 역할이 겹치지 않게 나뉘어 있다

| 파일 | 무엇을 담당하나 | 언제 연다 |
|---|---|---|
| [SPEC.md](SPEC.md) | **무엇을 왜** 만드는지. 기획 결정, `[확인 필요]` 항목, 부록 | 기능이 헷갈릴 때 |
| [plan.md](plan.md) | **어떻게** 만드는지. `lib/mock/` 데이터 모양, 업무 규칙 함수 11개, Phase별 설계 이유 | 코드를 새로 짤 때 |
| [tasks.md](tasks.md) | 전체 진행 현황표, 트랙 간 의존 관계, Phase 9(통합) | 지금 뭐가 끝났는지 볼 때 |
| [README.md](README.md) | 처음 클론한 사람이 1분 안에 `npm run dev`까지 가는 법 | 새 팀원이 왔을 때 |
| [CLAUDE.md](CLAUDE.md) | AI 어시스턴트용 — 지켜야 할 규칙 요약, Next 16 함정 | AI에게 작업시킬 때 |

**겹치지 않는 이유**: SPEC은 "왜", plan은 "어떻게 설계했나", tasks는 "지금 어디까지 됐나"로 시점이 다르다. 같은 내용을 두 곳에 쓰지 않으려고 tasks.md는 자기 파일 내용을 복사하지 않고 트랙별 tasks.md를 링크만 한다.

## 2. 트랙별 체크리스트 4개

각 파일 안에 "이미 만들어져 있는 것 / 시작 전 알아야 할 것 / Phase별 체크박스 / 절대 어기면 안 되는 것"이 들어 있다.

| 폴더 | 담당 | 지금 상태 |
|---|---|---|
| [A-기반인증운영/](A-기반인증운영/tasks.md) | 기반·인증·관리자 | Phase 0·1·7 코드 완료, 테스트 통과 |
| [B-프로필안전/](B-프로필안전/tasks.md) | 프로필·차단·신고 | ⬜ 시작 전 |
| [C-검색신청/](C-검색신청/tasks.md) | 검색·친구 신청 | ⬜ 시작 전 |
| [D-채팅게임/](D-채팅게임/tasks.md) | 채팅·밸런스게임 | ⬜ 시작 전 |

이 폴더들 안에는 코드가 없다. **체크리스트 전용 폴더**다. 실제 코드는 전부 `app/`·`lib/`에 있다.

## 3. 시뮬레이션 데이터 계층 — `lib/mock/`

**예전 `supabase/`의 SQL 5개가 하던 역할을 여기가 전부 대신한다.** 서버가 없으므로 "먼저 실행"할 게 없다 — `npm run dev`를 켜는 순간 `lib/mock/store.ts`가 알아서 초기 데이터를 채운다.

| 파일 | 상태 | 내용 |
|---|---|---|
| `mock/seed.ts` | ✅ | 초기 데이터: 태그 20개·밸런스게임 질문 30개·더미 사용자 20명·신청 6건·대화방 1개(메시지 6개) |
| `mock/store.ts` | ✅ | `localStorage`(데이터) + `sessionStorage`(로그인한 사람) 저장소. `getStore()`/`persist()`/`resetStore()` |
| `mock/auth.ts` | ✅ | 로그인(`signInWithSchoolEmail`)·로그아웃·프로필 생성(`createProfile`) |
| `mock/api.ts` | ✅ 테스트 12개 | 업무 규칙 함수 11개 — 하루 신청 상한·차단 양방향·신고 임계치·자동 정지 없음이 전부 여기 있다 |
| `mock/useCurrentProfile.ts` | ✅ | 로그인 상태를 읽는 React 훅. 페이지 접근 차단에 쓴다 |

## 4. 공용 로직 — `lib/`

화면 여러 개가 같이 쓰는 규칙. **여기 있는 값을 화면에서 다시 계산하면 버그다** (한 곳에서만 판정하기로 한 규칙).

| 파일 | 상태 | 내용 |
|---|---|---|
| `types.ts` | ✅ | 데이터 모델 타입. A만 수정 |
| `validation.ts` | ✅ 테스트 15개 | 학교 이메일·인사말·닉네임·태그 개수 검증 |
| `age.ts` | ✅ 테스트 4개 | 출생연도 → 나이. 나이는 저장 안 하고 매번 계산 |
| `limits.ts` | ✅ 테스트 5개 | 하루 신청 상한(5) 표시용 계산. **판정은 `mock/api.ts`가 한다** |
| `departments.ts` | 🔧 임시 목록 | 경기대 실제 학과명으로 교체 필요 |
| `appName.ts` | 🔧 미정(TBD) | 앱 이름 |

## 5. 화면 — `app/`

Next.js가 URL 경로로 그대로 읽는 폴더라 이 구조는 임의로 바꿀 수 없다. **전부 `'use client'`다** — 서버 컴포넌트가 하나도 없다(`layout.tsx`만 예외, `metadata` 때문에 서버 컴포넌트로 남아야 한다).

```
app/
├─ page.tsx              ✅        랜딩 · 시뮬레이션 상태 표시
├─ layout.tsx             ✅        전체 틀 (서버 컴포넌트, metadata만 담당)
├─ globals.css            ✅        파랑 계열 색상 토큰
├─ login/
│  └─ page.tsx            🟡        이메일 입력 로그인
├─ onboarding/
│  ├─ page.tsx            🟡        프로필 최초 작성 화면 뼈대
│  └─ OnboardingForm.tsx  🟡🔧      실제 폼. 태그 선택 부분은 B의 TagPicker로 교체 예정
├─ suspended/
│  └─ page.tsx            🟡        정지 안내
└─ admin/
   ├─ page.tsx            🟡        신고 목록 + 지표 카드
   └─ ReportRow.tsx       🟡🔧      신고 한 줄. 아바타는 B의 Avatar로 교체 예정
```

**`app/actions/*.ts`(서버 액션)는 없다.** 화면이 `lib/mock/api.ts`·`lib/mock/auth.ts`를 직접 부른다.

**아직 없는 화면** (B·C·D 담당, 각 트랙 tasks.md 참고): `app/me`(내 프로필 편집) · `app/search` · `app/profile/[id]` · `app/requests` · `app/chat/**`

## 6. 테스트 — `tests/`

| 파일 | 개수 | 검사 대상 |
|---|---|---|
| `validation.test.ts` | 15 | 이메일 도메인, 인사말·닉네임·태그 개수 |
| `age.test.ts` | 4 | 출생연도 → 나이 변환, 나이 범위 뒤집기 |
| `limits.test.ts` | 5 | 하루 신청 상한 계산의 경계값 |
| `mockApi.test.ts` | 12 | 하루 5건 상한, 차단 양방향, 신고 3명 임계치, 자동 정지 없음, 상호 차단, 대화 이어진 관계 수 계산 |

`lib/`의 함수와 1:1로 대응한다. 전부 순수 함수/로직 테스트다 — 화면 클릭 흐름은 각 Phase의 🔍 눈 확인 항목이 담당한다.

## 7. 프로젝트 설정

`package.json`(의존성 — `@supabase/*` 없음)·`tsconfig.json`·`eslint.config.mjs`·`postcss.config.mjs`·`next.config.ts`·`vitest.config.mts`·`.gitignore`.

**없어진 것**: `.env.local`(필요 없음), `proxy.ts`(미들웨어 자체가 없음), `supabase/` 폴더(git 이력에는 남아 있음).

---

## 지금 뭘 보면 되나

- **"내 트랙에서 뭘 하면 되지?"** → 자기 폴더의 `tasks.md`
- **"이 화면 코드가 왜 이렇게 짜였지?"** → `plan.md`에서 해당 Phase 절
- **"이 기능이 왜 이 규칙을 따르지?"** → `SPEC.md`에서 해당 조항
- **"이 파일이 뭐 하는 거지?"** → 이 문서(FILES.md)

이 문서는 파일이 새로 생기거나 상태가 바뀔 때(🟡 → ✅) 함께 갱신한다.
