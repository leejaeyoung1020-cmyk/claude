# 친구 만들기 앱 구현 계획

> **에이전트로 실행할 경우:** `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans` 스킬을 사용해 단계별로 진행한다. 모든 항목은 체크박스(`- [ ]`) 형식이며 세부 체크리스트는 [tasks.md](tasks.md)에 있다.

**목표:** 경기대 재학생이 관심사로 사람을 검색하고, 친구 신청을 보내 수락되면 1:1 채팅을 하고, 만난 자리에서 밸런스게임으로 어색함을 푸는 웹앱을 만든다.

**아키텍처:** Next.js(App Router) 한 개의 프로젝트가 화면과 서버 액션을 모두 담당하고, 데이터·인증·실시간·파일 저장은 Supabase가 맡는다. **업무 규칙(하루 신청 상한, 차단 반영, 신고 임계치)은 전부 Postgres 함수(RPC)에 넣는다.** 화면 코드는 규칙을 알 필요 없이 RPC만 호출하므로, 4명이 서로 다른 화면을 동시에 만들어도 규칙이 어긋나지 않는다.

**기술 스택:** Next.js 16 (App Router, TypeScript) / Tailwind CSS / Supabase (Postgres · Auth · Realtime · Storage) / Vitest / Vercel 배포

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
| Supabase 운영 방식 | 실제 무료 플랜 프로젝트 하나를 팀이 공유. 프로덕션 강화(유료 플랜·백업·스테이징 분리·커스텀 도메인)는 하지 않는다 | 2026-08-19 결정 |

---

## 파일 구조

```
친구만들기앱/
├─ SPEC.md                       기획서
├─ plan.md                       이 문서
├─ tasks.md                      체크리스트
├─ .env.local                    Supabase 키 (git 제외)
├─ supabase/
│  ├─ migrations/
│  │  ├─ 001_schema.sql          테이블 · 인덱스
│  │  ├─ 002_rls.sql             행 수준 보안 정책
│  │  ├─ 003_functions.sql       업무 규칙 RPC
│  │  ├─ 004_email_guard.sql     학교 이메일 도메인 강제
│  │  └─ 005_metrics.sql         성공 지표 뷰
│  └─ seed.sql                   태그·질문·더미 사용자 20명
├─ lib/
│  ├─ supabase/client.ts         브라우저용 클라이언트
│  ├─ supabase/server.ts         서버 컴포넌트용 클라이언트
│  ├─ types.ts                   DB 타입 정의 (공용)
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
│  ├─ page.tsx                   랜딩 → 로그인
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
│  ├─ suspended/page.tsx         정지 안내
│  └─ actions/*.ts               서버 액션 (RPC 호출 래퍼)
├─ proxy.ts                      접근 차단 (Next 16에서 middleware.ts의 새 이름)
├─ tests/                        Vitest 단위 테스트
└─ docs/QA.md                    단계별 눈 확인 절차 기록
```

---

## 데이터베이스 설계

`supabase/migrations/001_schema.sql` 전문. **Phase 0에서 이 파일을 그대로 실행한다.**

```sql
-- 1. 프로필
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nickname        text not null check (char_length(nickname) between 1 and 12),
  birth_year      int  not null check (birth_year between 1980 and 2015),
  department      text not null,
  gender          text not null check (gender in ('male','female')),
  bio             text not null check (char_length(bio) between 1 and 60),
  photo_url       text,
  is_admin        boolean not null default false,
  suspended_until timestamptz,
  suspend_reason  text,
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);
create index on profiles (last_seen_at desc);
create index on profiles (department);

-- 2. 관심사 태그 (고정 목록)
create table interest_tags (
  id    smallint primary key,
  label text not null unique
);
create table profile_tags (
  profile_id uuid     references profiles(id) on delete cascade,
  tag_id     smallint references interest_tags(id),
  primary key (profile_id, tag_id)
);
create index on profile_tags (tag_id);

-- 3. 친구 신청
create table friend_requests (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references profiles(id) on delete cascade,
  receiver_id  uuid not null references profiles(id) on delete cascade,
  greeting     text not null check (char_length(greeting) between 1 and 200),
  status       text not null default 'pending'
               check (status in ('pending','accepted','rejected')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);
create index on friend_requests (receiver_id, status);
create index on friend_requests (sender_id, created_at desc);

-- 4. 대화방 (user_a < user_b 로 정렬 저장해 중복 방지)
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references profiles(id) on delete cascade,
  user_b     uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 1000),
  created_at      timestamptz not null default now()
);
create index on messages (conversation_id, created_at desc);

-- 안 읽은 메시지 계산용 (읽음 확인 '표시'는 SPEC 제외 항목이므로 상대에게 노출하지 않는다)
create table conversation_reads (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- 5. 차단 (제재와 무관)
create table blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index on blocks (blocked_id);

-- 6. 신고
create table reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references profiles(id) on delete cascade,
  reported_id  uuid not null references profiles(id) on delete cascade,
  reason       text not null check (reason in
               ('abuse','sexual','spam','pressure','impersonation','other')),
  detail       text,
  status       text not null default 'pending'
               check (status in ('pending','dismissed','warned','suspended')),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid references profiles(id),
  unique (reporter_id, reported_id),
  check (reporter_id <> reported_id)
);
create index on reports (reported_id, status);

-- 7. 밸런스게임 질문
create table balance_questions (
  id       smallint primary key,
  option_a text not null,
  option_b text not null
);

-- 8. 관리자 화면용 뷰: 서로 다른 신고자 3명 이상 = 검토 대기
create view report_queue as
select
  r.reported_id,
  count(distinct r.reporter_id)                       as reporter_count,
  count(*) filter (where r.status = 'pending')        as pending_count,
  max(r.created_at)                                   as latest_at
from reports r
group by r.reported_id
having count(distinct r.reporter_id) >= 3;
```

### 행 수준 보안 (`002_rls.sql`)

**RLS를 켜지 않으면 anon key만 있으면 누구나 전체 테이블을 읽을 수 있다.** 배포 전에 반드시 확인한다.

```sql
alter table profiles           enable row level security;
alter table profile_tags       enable row level security;
alter table friend_requests    enable row level security;
alter table conversations      enable row level security;
alter table messages           enable row level security;
alter table conversation_reads enable row level security;
alter table blocks             enable row level security;
alter table reports            enable row level security;

-- 프로필: 로그인한 사람은 모두 읽을 수 있다 (검색이 동작해야 하므로).
-- 단 쓰기는 본인만. 검색 시 차단·정지 제외는 search_profiles 함수가 처리한다.
create policy profiles_read   on profiles for select to authenticated using (true);
create policy profiles_insert on profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on profiles for update to authenticated using (id = auth.uid());

-- 태그 연결: 읽기는 전체, 쓰기는 본인 것만
create policy ptags_read  on profile_tags for select to authenticated using (true);
create policy ptags_write on profile_tags for all    to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- 친구 신청: 당사자만 본다. 생성·수정은 RPC(security definer)가 하므로 정책은 읽기만 연다
create policy freq_read on friend_requests for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- 대화방·메시지: 참여자만
create policy conv_read on conversations for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

create policy msg_read on messages for select to authenticated
  using (exists (select 1 from conversations c
                 where c.id = conversation_id
                   and (c.user_a = auth.uid() or c.user_b = auth.uid())));

create policy msg_insert on messages for insert to authenticated
  with check (sender_id = auth.uid()
    and exists (select 1 from conversations c
                where c.id = conversation_id
                  and (c.user_a = auth.uid() or c.user_b = auth.uid())));

create policy reads_own on conversation_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 차단: 내가 건 차단만 보인다. 상대는 자기가 차단당한 걸 알 수 없어야 한다
create policy blocks_read on blocks for select to authenticated
  using (blocker_id = auth.uid());

-- 신고: 내가 낸 신고만 보인다. 관리자 화면은 RPC로 조회한다
create policy reports_read on reports for select to authenticated
  using (reporter_id = auth.uid());

-- 태그 목록·밸런스게임 질문은 공개 읽기 (RLS 불필요, 쓰기 권한만 막는다)
alter table interest_tags     enable row level security;
alter table balance_questions enable row level security;
create policy tags_read on interest_tags     for select to authenticated using (true);
create policy bq_read   on balance_questions for select to authenticated using (true);
```

**`blocks`와 `reports`의 읽기 정책이 특히 중요하다.** 정책을 `using (true)`로 열어두면 브라우저 개발자 도구에서 "누가 나를 차단했는지", "누가 나를 신고했는지"를 그대로 볼 수 있다. SPEC 4.5의 "상대에게 알리지 않는다"가 여기서 무너진다.

### 성공 지표 측정 (`005_metrics.sql`)

SPEC 8장의 주지표 "대화가 이어진 관계 수(양방향 3턴 이상)"를 사람이 손으로 세지 않아도 되게 뷰로 만든다. 발표 때 이 숫자 하나를 보여줄 수 있어야 한다.

```sql
create view metrics_summary as
with turns as (
  select conversation_id, sender_id, count(*) as n
  from messages group by conversation_id, sender_id
),
active as (
  select conversation_id from turns
  group by conversation_id
  having count(*) = 2 and min(n) >= 3     -- 양쪽 모두 3턴 이상
)
select
  (select count(*) from profiles)                                        as 가입자수,
  (select count(*) from friend_requests)                                 as 신청건수,
  (select count(*) from friend_requests where status = 'accepted')       as 수락건수,
  (select count(*) from conversations)                                   as 대화방수,
  (select count(*) from active)                                          as 대화이어진관계수,
  round(
    (select count(*) from friend_requests where status = 'accepted')::numeric
    / nullif((select count(*) from friend_requests), 0) * 100, 1)        as 수락률;
```

**설계 판단 세 가지**

- **`conversations`에 `user_a < user_b` 제약을 건 이유** — 두 사람 사이 대화방이 두 개 생기는 사고를 DB가 막는다. 애플리케이션이 순서를 신경 쓸 필요가 없다.
- **읽음 상태를 `conversation_reads`로 분리한 이유** — SPEC은 "안 읽은 메시지 표시"는 포함하고 "읽음 확인 표시"는 제외한다. 메시지 행에 `read_at`을 두면 상대의 읽음 여부가 자연히 노출되므로, **내가 어디까지 읽었는지만** 따로 저장한다.
- **`report_queue`를 뷰로 만든 이유** — 임계치 3이 SQL 한 줄에만 있으므로 숫자를 바꿀 때 고칠 곳이 한 군데다.

---

## 업무 규칙 함수 (RPC)

`supabase/migrations/003_functions.sql`. **화면 코드는 이 함수들만 호출한다.**
전부 `security definer`로 만들고, 함수 안에서 `auth.uid()`로 호출자를 확인한다.

| 함수 | 시그니처 | 하는 일 |
|---|---|---|
| `search_profiles` | `(p_gender text, p_min_age int, p_max_age int, p_department text, p_tag_ids smallint[], p_limit int, p_offset int) returns setof profile_card` | 필터 적용 검색. 나 자신·차단 양방향·정지 중인 사람을 자동 제외 |
| `send_friend_request` | `(p_receiver uuid, p_greeting text) returns uuid` | 하루 5건 상한·중복·차단·자기 자신·정지 검사 후 신청 생성 |
| `respond_friend_request` | `(p_request uuid, p_accept boolean) returns uuid` | 수락이면 대화방을 만들고 그 id 반환, 거절이면 null |
| `remaining_requests_today` | `() returns int` | 오늘 남은 신청 횟수 |
| `block_user` / `unblock_user` | `(p_target uuid) returns void` | 차단 추가·해제 |
| `report_user` | `(p_target uuid, p_reason text, p_detail text) returns uuid` | 신고 생성 + 상호 차단 자동 적용 |
| `mark_conversation_read` | `(p_conversation uuid) returns void` | 읽음 시각 갱신 |
| `admin_resolve_report` | `(p_reported uuid, p_action text, p_days int) returns void` | `dismissed`/`warned`/`suspended` 처리. 관리자만 |

`profile_card` 복합 타입 (검색 결과 한 줄):

```sql
create type profile_card as (
  id uuid, nickname text, birth_year int, department text,
  gender text, bio text, photo_url text, tag_labels text[]
);
```

`send_friend_request` 본문 — **여기가 하루 5건 상한의 유일한 구현 위치다.**

```sql
create or replace function send_friend_request(p_receiver uuid, p_greeting text)
returns uuid language plpgsql security definer as $$
declare v_me uuid := auth.uid(); v_id uuid; v_count int;
begin
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if v_me = p_receiver then raise exception '자기 자신에게는 신청할 수 없습니다'; end if;
  if char_length(p_greeting) < 1 then raise exception '인사말을 입력해 주세요'; end if;

  if exists (select 1 from profiles
             where id = v_me and suspended_until > now()) then
    raise exception '정지 중에는 신청할 수 없습니다';
  end if;

  if exists (select 1 from blocks
             where (blocker_id = v_me and blocked_id = p_receiver)
                or (blocker_id = p_receiver and blocked_id = v_me)) then
    raise exception '신청할 수 없는 상대입니다';
  end if;

  select count(*) into v_count from friend_requests
  where sender_id = v_me and created_at >= date_trunc('day', now());
  if v_count >= 5 then raise exception '하루에 보낼 수 있는 신청은 5건입니다'; end if;

  insert into friend_requests (sender_id, receiver_id, greeting)
  values (v_me, p_receiver, p_greeting)
  returning id into v_id;
  return v_id;
end $$;
```

---

## 팀 4명 역할 분담안

역할이 아직 정해지지 않았으므로 **기능 축으로 4갈래**를 제안한다. 서로 건드리는 파일이 겹치지 않도록 나눴다.

| 담당 | 이름 | 맡는 화면·파일 | 담당 Phase |
|---|---|---|---|
| **A** | 기반·인증·운영 | `supabase/**`, `lib/supabase/**`, `app/login/**`, `app/onboarding`, `app/admin`, `app/suspended`, 배포 | 0 · 1 · 7 · 9 |
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

1. `lib/types.ts`와 `supabase/migrations/**`는 **A만 수정한다.** 다른 사람이 스키마 변경이 필요하면 A에게 요청한다. 동시에 고치면 반드시 충돌한다.
2. 각자 `feature/<이름>-<기능>` 브랜치에서 작업하고, Phase 하나가 끝날 때마다 `main`에 합친다. 하루 이상 안 합치지 않는다.
3. 모든 Phase는 **"눈으로 확인" 절차를 통과해야 끝난 것이다.** 확인 결과를 `docs/QA.md`에 한 줄씩 남긴다.

---

## Phase 0 — 프로젝트 기반 (담당 A, 전원 참관)

**끝나면 보이는 것:** `npm run dev` 후 브라우저에 "친구만들기앱 · DB 연결됨 · 더미 사용자 20명" 이 뜬다.

**만드는 파일:** `package.json`, `app/layout.tsx`, `app/page.tsx`, `lib/supabase/*`, `lib/types.ts`, `supabase/migrations/001~004`, `supabase/seed.sql`, `.env.local`, `vitest.config.ts`

**핵심 작업**

1. `npx create-next-app@latest . --typescript --tailwind --app --eslint` 으로 프로젝트 생성
2. Supabase 대시보드에서 프로젝트를 만들고 URL·anon key를 `.env.local`에 넣는다
3. `001_schema.sql` ~ `004_email_guard.sql`을 SQL Editor에 붙여 실행
4. `seed.sql`로 태그 20개, 밸런스게임 질문 30개, 더미 사용자 20명, 신청 5건, 대화방 1개(메시지 6개)를 넣는다
5. `app/page.tsx`가 `profiles` 개수를 세어 화면에 출력 — DB 연결 확인용

**학교 이메일 강제** (`004_email_guard.sql`) — 이 트리거가 없으면 아무 이메일로나 가입된다.

```sql
create or replace function public.enforce_school_email()
returns trigger language plpgsql as $$
begin
  if new.email is null or new.email not like '%@kyonggi.ac.kr' then
    raise exception '경기대학교 이메일(@kyonggi.ac.kr)만 가입할 수 있습니다';
  end if;
  return new;
end $$;

create trigger enforce_school_email_trigger
  before insert on auth.users
  for each row execute function public.enforce_school_email();
```

**눈으로 확인**

- [ ] `npm run dev` → `http://localhost:3000` 에 "더미 사용자 20명"이 표시된다
- [ ] Supabase Table Editor에서 `profiles` 20행, `interest_tags` 20행, `balance_questions` 30행이 보인다
- [ ] SQL Editor에서 `select * from search_profiles(null,19,30,null,null,10,0);` 실행 시 결과가 나온다
- [ ] `.env.local`이 `.gitignore`에 들어 있다 (커밋되면 키가 유출된다)

---

## Phase 1 — 재학생 인증 (담당 A)

**끝나면 보이는 것:** 학교 이메일 주소를 입력하면 바로 로그인되고, 프로필을 작성해 검색 화면까지 들어간다. 다른 도메인 메일은 거부된다.

**만드는 파일:** `app/login/page.tsx`, `app/onboarding/page.tsx`, `app/actions/auth.ts`, `app/actions/profile.ts`, `proxy.ts`, `lib/validation.ts`, `lib/auth.ts`, `tests/validation.test.ts`

**흐름 (2026-08-19 변경 — 시연 전용)**

당초 6자리 인증코드를 메일로 보내기로 했으나, v1이 팀 내 시연 범위로 정해지면서 **메일을 아예 보내지 않는 방식**으로 바꿨다. 이메일에서 만들어낸 고정 비밀번호로 계정을 자동 생성·로그인시키므로 세션·RLS·`auth.uid()`는 전부 진짜로 동작하고, 사용자에게는 이메일 한 칸만 보인다.

```
/login  학교 이메일 입력
   → isSchoolEmail() 로 도메인 확인
   → signInWithPassword(email, demoPassword(email))
       실패하면 signUp 후 재시도
   → 프로필 있으면 /search, 없으면 /onboarding
```

**이메일 주소만 알면 그 사람으로 로그인된다.** 실제 학생을 받기로 하면 반드시 인증코드 방식으로 되돌린다. 도메인 검사는 이 방식에서도 DB 트리거(`004_email_guard.sql`)로 유지된다.

Supabase 대시보드에서 **Authentication → Email의 "Confirm email"을 꺼야** 동작한다.

**`proxy.ts`가 지켜야 할 것 (SPEC 4.1: 인증 전 어떤 화면도 못 봄)**

- 세션 없음 → `/login`으로
- 세션 있고 프로필 없음 → `/onboarding`으로
- `suspended_until > now()` → `/suspended`로
- 예외 경로: `/`, `/login`, `/suspended`

**눈으로 확인**

- [ ] `test@gmail.com` 입력 → "경기대학교 이메일(@kyonggi.ac.kr)만 사용할 수 있습니다" 오류가 뜬다
- [ ] 본인 `@kyonggi.ac.kr` 주소 입력 → 메일 없이 바로 `/onboarding`으로 넘어간다
- [ ] 같은 이메일로 다시 로그인 → 온보딩을 건너뛰고 바로 검색 화면으로 간다
- [ ] 프로필 작성 완료 → `/search`로 이동하고, Supabase `profiles`에 내 행이 생긴다
- [ ] 로그아웃 후 주소창에 `/search`를 직접 입력 → `/login`으로 튕긴다

---

## Phase 2 — 프로필 (담당 B)

**끝나면 보이는 것:** 내 프로필을 고치고 사진을 올릴 수 있다. 사진을 안 올려도 태그 색 배경의 기본 이미지가 나온다. 태그는 6개째부터 선택되지 않는다.

**만드는 파일:** `app/me/page.tsx`, `app/actions/profile.ts`, `components/TagPicker.tsx`, `components/TagChip.tsx`, `components/Avatar.tsx`, `lib/age.ts`, `tests/age.test.ts`, `tests/tagpicker.test.ts`

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

- 태그는 `interest_tags`에서 불러온 **고정 목록**이다. 자유 입력창을 만들지 않는다
- 6개째 선택 시도 시 조용히 무시하지 말고 "최대 5개까지 고를 수 있어요" 문구를 띄운다
- 사진 업로드는 Supabase Storage `avatars` 버킷. 5MB 초과·이미지 아닌 파일은 거부한다
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

**만드는 파일:** `app/search/page.tsx`, `app/actions/search.ts`, `components/ProfileCard.tsx`, `tests/searchparams.test.ts`

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

**만드는 파일:** `app/profile/[id]/page.tsx`(신청 부분), `app/requests/page.tsx`, `app/actions/requests.ts`, `lib/limits.ts`, `tests/limits.test.ts`

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
- [ ] 다른 브라우저(시크릿 창)로 두 번째 계정 로그인 → `/requests`에 신청이 보인다
- [ ] 수락 → 두 계정 모두 `/chat`에 대화방이 생긴다
- [ ] 거절 → 보낸 쪽 화면에 "거절당했다"는 표시가 **없다**

---

## Phase 5 — 1:1 채팅 (담당 D)

**끝나면 보이는 것:** 두 브라우저 창을 나란히 띄우고 한쪽에서 메시지를 보내면 다른 쪽에 새로고침 없이 즉시 뜬다.

**만드는 파일:** `app/chat/page.tsx`, `app/chat/[id]/page.tsx`, `app/actions/chat.ts`, `components/MessageBubble.tsx`

**실시간 구현**

```ts
// app/chat/[id]/page.tsx
supabase
  .channel(`room:${conversationId}`)
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversationId}` },
      ({ new: msg }) => setMessages(prev => [...prev, msg]))
  .subscribe()
```

Phase 0에서 `alter publication supabase_realtime add table messages;`를 실행해 둬야 동작한다. **안 되면 이걸 먼저 의심한다.**

**대화방 목록 (`/chat`)** — 상대 닉네임·아바타, 마지막 메시지 미리보기, 안 읽은 개수 배지. 안 읽은 개수는 `conversation_reads.last_read_at` 이후 메시지 수로 계산한다.

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

**만드는 파일:** `app/profile/[id]/page.tsx`(차단·신고 부분), `components/ReportDialog.tsx`, `app/actions/safety.ts`

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
- [ ] 신고 후 Supabase `reports` 테이블에 행이 생기고, `blocks`에도 양방향 행이 생긴다
- [ ] 서로 다른 계정 3개로 같은 사람을 신고 → `select * from report_queue;` 에 그 사람이 나온다

---

## Phase 7 — 관리자 화면 (담당 A)

**끝나면 보이는 것:** 관리자 계정으로 `/admin`에 들어가면 신고 목록이 보이고, 정지 버튼을 누르면 그 사용자가 다음 로그인 때 정지 안내 화면을 본다.

**만드는 파일:** `app/admin/page.tsx`, `app/suspended/page.tsx`, `app/actions/admin.ts`

**화면**

- 신고 목록: 신고 대상 / 서로 다른 신고자 수 / 최근 신고일 / 사유 목록. **신고자 수 많은 순**으로 정렬
- 각 항목에 `기각` · `경고` · `정지(일수 입력, 기본 30)` 버튼
- 정지된 사용자는 `proxy.ts`에 의해 `/suspended`로 보내지고, 사유와 해제 예정일, 문의 이메일 주소를 본다

**반드시 지킬 것**

- `/admin`은 `profiles.is_admin = true`인 사람만 열 수 있다. 화면에서 숨기는 것만으로는 부족하고 **`admin_resolve_report` 함수 안에서도 다시 확인**한다
- **검토 대기 중이라고 자동 정지하지 않는다** (SPEC 4.5). 목록에 올라와도 그 사람은 계속 정상 노출된다. 이걸 어기면 담합 신고로 무고한 사용자가 쫓겨난다

**눈으로 확인**

- [ ] 일반 계정으로 `/admin` 접근 → 막힌다 (주소창 직접 입력도 막혀야 한다)
- [ ] `is_admin = true`로 바꾼 계정 → 신고 목록이 보인다
- [ ] 신고 3건 쌓인 사용자가 목록 맨 위에 온다
- [ ] 그 사용자는 **아직 검색에 정상적으로 나온다** (자동 정지 없음 확인)
- [ ] `정지 30일` 클릭 → 해당 계정으로 로그인하면 `/suspended`가 뜨고 해제 예정일이 보인다
- [ ] 정지된 계정은 검색 결과에서 사라진다
- [ ] `기각` 클릭 → 목록에서 내려간다

---

## Phase 8 — 대면 밸런스게임 (담당 D)

**끝나면 보이는 것:** 대화방에서 "만났어요"를 누르면 큰 글씨 질문이 뜨고, 넘기기로 계속 다음 질문을 본다. 답을 입력하는 곳이 없다.

**만드는 파일:** `app/chat/[id]/meet/page.tsx`

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
- [ ] 화면을 나갔다 다시 들어와도 Supabase에 아무 데이터도 안 쌓인다

---

## Phase 9 — 통합·배포 (담당 A 주도, 전원 참여)

**끝나면 보이는 것:** 배포된 주소에서 팀원 4명이 서로 다른 계정으로 가입해 검색·신청·채팅까지 실제로 해본다.

**작업**

1. Vercel에 연결하고 환경 변수 2개(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)를 등록
2. Supabase Auth 설정에서 Site URL과 Redirect URL을 배포 주소로 변경
3. **더미 데이터 정리** — 발표용으로 남길지, 실제 사용자만 남길지 결정
4. `docs/QA.md`에 전체 흐름 통과 기록

**전체 흐름 눈 확인 (4명이 각자 다른 계정으로)**

- [ ] 4명 전원 학교 메일로 가입 → 프로필 작성 완료
- [ ] 서로를 검색으로 찾을 수 있다
- [ ] 신청 → 수락 → 채팅이 실제 배포 주소에서 동작한다
- [ ] 한 명이 다른 한 명을 차단 → 양쪽 모두에서 사라진다
- [ ] 3명이 한 명을 신고 → 관리자 화면에 뜬다 → 정지 처리 → 그 계정이 정지 화면을 본다
- [ ] 대화방에서 밸런스게임 화면이 열린다
- [ ] 휴대폰 브라우저로 접속해도 화면이 깨지지 않는다

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
