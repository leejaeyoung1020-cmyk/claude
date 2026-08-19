# 경기대학교 친구 만들기 앱

경기대 안에서 **같이 뭔가 할 사람**을 찾는 웹앱. 관심사 태그로 사람을 검색하고, 친구 신청이 수락되면 1:1 채팅을 하고, 만난 자리에서 밸런스게임으로 어색함을 푼다.

앱 이름은 아직 정하지 않았다.

## 처음 오는 사람이 읽는 순서

1. [SPEC.md](SPEC.md) — 무엇을 왜 만드는지. **먼저 읽는다**
2. [plan.md](plan.md) — 구현 계획. DB 스키마 SQL 전문, RPC 목록, Phase 0~9
3. [tasks.md](tasks.md) — 전체 인덱스와 팀 분담
4. 자기 트랙의 체크리스트 — 아래 표

| 트랙 | 맡는 것 | 체크리스트 |
|---|---|---|
| A | 기반 · 인증 · 운영 | [A-기반인증운영/tasks.md](A-기반인증운영/tasks.md) |
| B | 프로필 · 안전장치 | [B-프로필안전/tasks.md](B-프로필안전/tasks.md) |
| C | 검색 · 친구 신청 | [C-검색신청/tasks.md](C-검색신청/tasks.md) |
| D | 채팅 · 밸런스게임 | [D-채팅게임/tasks.md](D-채팅게임/tasks.md) |

## 환경 준비

```bash
npm install
cp .env.local.example .env.local   # 값 두 개를 A에게 받아서 채운다
npm run dev                        # http://localhost:3000
```

첫 화면 아래 띠가 초록색 **"DB 연결됨 · 사용자 20명 …"** 이면 준비 끝이다.
노란색이면 `.env.local` 값이 없거나 틀렸다.

**Supabase는 팀에서 하나만 쓴다.** 각자 프로젝트를 만들면 데이터가 갈라져서 서로의 화면을 테스트할 수 없다. A가 만든 프로젝트의 URL과 anon key를 받아 쓴다.

## 명령어

```bash
npm run dev                            # 개발 서버
npm run build                          # 프로덕션 빌드
npm test                               # 전체 테스트
npx vitest run tests/limits.test.ts    # 파일 하나만
npm run typecheck                      # 타입 검사
npm run lint                           # ESLint
```

## 알아둘 것

- **업무 규칙은 전부 Postgres 함수(RPC)에 있다.** 하루 신청 상한 5건, 차단 반영, 신고 임계치는 `supabase/migrations/003_functions.sql` 안에만 구현돼 있다. 화면 코드는 RPC를 호출하고 오류 메시지를 그대로 보여주기만 한다. 화면에서 상한을 세거나 차단 여부를 판단하는 코드를 쓰면 규칙이 두 벌이 되어 어긋난다
- **`supabase/**` 와 `lib/types.ts` 는 A만 고친다.** 스키마 변경이 필요하면 A에게 요청한다
- **남이 만드는 컴포넌트를 새로 만들지 않는다.** 늦어지면 임시로 막아두고, 나오면 반드시 교체한다. 누가 무엇을 만드는지는 자기 트랙 체크리스트의 "주고받는 것" 표에 있다
- 색은 `app/globals.css`의 `--brand-*` 토큰을 쓴다 (`bg-brand-600` 처럼)
- 화면 문구는 전부 한국어

## 현재 상태

Phase 0(기반)까지 끝났다. 자세한 진행 상황은 각 트랙의 체크리스트를 본다.

**로그인은 시연 전용 지름길을 쓴다.** `@kyonggi.ac.kr` 이메일 주소만 입력하면 인증코드 없이 바로 로그인된다. 이메일 주소를 아는 사람은 그 계정으로 들어올 수 있으므로, 실제 학생을 받기로 하면 반드시 인증코드 방식으로 되돌려야 한다. 자세한 내용은 [CLAUDE.md](CLAUDE.md)와 SPEC.md 7장에 있다.
