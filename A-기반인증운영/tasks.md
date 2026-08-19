# A — 기반 · 인증 · 운영

**맡는 것:** 시뮬레이션 데이터 계층(`lib/mock/`), 학교 이메일 로그인, 관리자 화면, 배포
**담당 Phase:** 0 · 1 · 7 · 9(주도)
**주로 건드리는 파일:** `lib/mock/**`, `lib/types.ts`, `app/login/**`, `app/onboarding`, `app/admin`, `app/suspended`

참고 문서: [../plan.md](../plan.md) · [../SPEC.md](../SPEC.md) · [../tasks.md](../tasks.md) · [../CLAUDE.md](../CLAUDE.md) · [../FILES.md](../FILES.md)

---

## Phase 0 · 1 · 7 은 전부 끝났다

**서버가 전혀 없다는 게 이번 트랙에서 가장 큰 결정이다 (2026-08-19, Supabase 전면 제거).** 처음엔 Supabase(DB·인증·RLS·RPC)로 만들었다가, 시뮬레이션만 돌리는 걸로 결정이 바뀌면서 `supabase/`·`lib/supabase/`·`proxy.ts`·`app/actions/*.ts`를 전부 지우고 `lib/mock/`으로 다시 만들었다. 그래서 예전 체크리스트에 있던 "Supabase 프로젝트 생성" · "SQL 실행" · "`.env.local` 설정" · "Confirm email 끄기" 같은 항목은 **전부 사라졌다.** `npm install && npm run dev`가 전부다.

### 지금 있는 것 (전부 검증됨: `npm run build`·`npm test` 40개 통과)

| 파일 | 내용 |
|---|---|
| `lib/mock/seed.ts` | 초기 데이터: 태그 20개·밸런스게임 질문 30개·더미 사용자 20명·신청 6건·대화방 1개(메시지 6개) |
| `lib/mock/store.ts` | `localStorage`(데이터) + `sessionStorage`(로그인 상태) 저장소 |
| `lib/mock/auth.ts` | `signInWithSchoolEmail()` · `signOut()` · `getCurrentProfile()` · `createProfile()` |
| `lib/mock/api.ts` | 업무 규칙 함수 15개 (검색·신청·차단·신고·채팅·관리자) |
| `lib/mock/useCurrentProfile.ts` | 로그인 상태를 읽는 훅. 페이지 접근 차단에 쓴다 |
| `lib/types.ts` | 데이터 모델 타입 |
| `app/page.tsx` | 랜딩, 시뮬레이션 상태 표시 |
| `app/login/page.tsx` | 학교 이메일 입력 로그인 |
| `app/onboarding/{page,OnboardingForm}.tsx` | 프로필 최초 작성 (태그 선택은 임시 구현, B의 `TagPicker`로 교체 예정) |
| `app/suspended/page.tsx` | 정지 안내 |
| `app/admin/{page,ReportRow}.tsx` | 신고 목록·처리·지표 (아바타는 임시, B의 `Avatar`로 교체 예정) |
| `tests/{validation,age,limits,mockApi}.test.ts` | 40개 |

### `lib/mock/api.ts`의 함수 목록 (B·C·D가 실제로 부르는 것)

| 함수 | 하는 일 |
|---|---|
| `searchProfiles(filters)` | 조건 검색. 자기 자신·차단·정지 제외, 태그는 OR |
| `remainingRequestsToday()` | 오늘 남은 신청 횟수 |
| `sendFriendRequest(receiverId, greeting)` | 하루 5건 상한 판정 후 신청 생성 |
| `respondFriendRequest(requestId, accept)` | 수락이면 대화방 id, 거절이면 `null` |
| `blockUser(targetId)` / `unblockUser(targetId)` | 차단·해제 |
| `reportUser(targetId, reason, detail?)` | 신고 + 자동 상호 차단 |
| `getMyConversations()` | 내 대화방 목록 (상대 프로필·마지막 메시지·안 읽은 개수 포함) |
| `getConversationMessages(id)` | 대화방 메시지 (참여자 아니면 빈 배열) |
| `sendMessage(id, body)` | 메시지 전송 |
| `markConversationRead(id)` / `unreadCount(id)` | 읽음 처리 |
| `adminReportQueue()` / `adminResolveReport()` / `adminMetrics()` | 관리자 전용 (내부에서 `is_admin` 재확인) |

**이 표에 없는 함수가 필요하면 나에게 요청한다.** `lib/mock/**`와 `lib/types.ts`는 A만 수정하는 파일이다 — 동시에 고치면 반드시 충돌한다.

### 남은 할 일 — 화면에서 실제로 클릭해 보며 확인

코드는 됐지만 브라우저에서 눌러보는 확인은 아직이다. 🔍 = 눈으로 확인 / 💾 = 커밋 지점

- [ ] `npm run dev` → 첫 화면에 "시뮬레이션 모드 · 사용자 20명 · 태그 20개 · 밸런스게임 질문 30개"가 뜬다
- [ ] `test@gmail.com`으로 로그인 시도 → "경기대학교 이메일(@kyonggi.ac.kr)만 사용할 수 있습니다"
- [ ] 본인 학교 메일 형식(`아무거나@kyonggi.ac.kr`)으로 로그인 → `/onboarding`으로 이동
- [ ] 태그를 5개 고른 뒤 6개째 클릭 → "최대 5개까지 고를 수 있어요"가 뜨고 선택되지 않는다
- [ ] 프로필 작성 완료 → `/search`로 이동 (아직 없으면 404 — C의 Phase 3을 기다린다)
- [ ] 같은 이메일로 다시 로그인 → 온보딩을 건너뛴다
- [ ] 개발자 도구 → Application → Local Storage에서 `friend-app-sim-v1` 키 안에 내 프로필이 생긴 것을 확인
- [ ] 콘솔에서 store를 불러와 아무 계정이나 `is_admin = true`로 바꿔 저장 (화면에 관리자 지정 기능이 생기기 전까지는 이 방법으로 확인)
- [ ] 관리자 계정으로 `/admin` 접속 → 지표 카드 6개가 보인다
- [ ] 일반 계정으로 `/admin` 접속 → `/search`로 튕긴다
- [ ] 💾 `chore: A 트랙 화면 확인 완료`

---

## Phase 9 — 통합·배포 (내가 주도)

B·C·D가 각자 트랙을 끝내면 시작한다. 자세한 절차는 [../tasks.md](../tasks.md)의 **Phase 9**에 있다. 요약:

- **환경 변수도 계정도 필요 없다.** Vercel(또는 아무 정적 호스팅)에 그냥 배포하면 된다
- **중요한 한계**: 서버가 없어 각자의 브라우저·기기마다 데이터가 독립적이다. 배포 주소에 팀원 4명이 각자 휴대폰으로 접속하면 서로를 찾을 수 없다 — 시연은 **한 브라우저의 탭 여러 개**로 한다 (`sessionStorage`가 탭마다 로그인을 분리해 준다)
- `resetStore()`를 부를 수 있는 버튼을 화면 어딘가에 마련해 두면 리허설 사이에 데이터를 초기 상태로 되돌릴 수 있다

---

## 절대 어기면 안 되는 것

- **`isSchoolEmail()` 검사를 빼먹지 않는다.** 없으면 아무 이메일로나 가입된다 (SPEC 4.1)
- **검토 대기 중이라고 자동 정지하지 않는다.** 관리자가 `adminResolveReport()`를 부르기 전까지 그 사람은 계속 정상 노출된다. 이걸 어기면 담합 신고로 무고한 사용자가 쫓겨난다 (SPEC 4.5)
- **`/admin` 접근 제한을 화면 숨김으로만 처리하지 않는다.** `adminReportQueue()`·`adminResolveReport()`·`adminMetrics()` 안에서도 `is_admin`을 다시 확인한다 (이미 돼 있다 — 새로 함수를 추가할 때 이 패턴을 유지한다)
- **로그인 정보(`sessionStorage`)와 데이터(`localStorage`)를 섞지 않는다.** 섞으면 탭마다 다른 계정으로 로그인하는 게 불가능해진다

---

Phase 9까지 끝났으면 발표 준비로 넘어간다 ([../tasks.md](../tasks.md) 맨 아래).
