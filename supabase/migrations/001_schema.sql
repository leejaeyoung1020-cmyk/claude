-- 001_schema.sql — 테이블 · 인덱스 · 타입
-- Supabase 대시보드 SQL Editor에 붙여넣어 실행한다.
-- 실행 순서: 001 → 002 → 003 → 004 → 005 → seed.sql

-- ---------------------------------------------------------------
-- 1. 프로필
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- 2. 관심사 태그 (고정 목록 — 자유 입력 금지, SPEC 4.2)
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- 3. 친구 신청
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- 4. 대화방과 메시지
--    user_a < user_b 로 정렬 저장해 대화방 중복 생성을 DB가 막는다
-- ---------------------------------------------------------------
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

-- 안 읽은 메시지 계산용.
-- 메시지 행에 read_at 을 두지 않는 이유: 그러면 "상대가 읽었음"이 노출되는데
-- 읽음 확인 표시는 SPEC 4.4 의 제외 항목이다. 내가 어디까지 읽었는지만 저장한다.
create table conversation_reads (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- ---------------------------------------------------------------
-- 5. 차단 — 제재와 무관하다 (SPEC 4.5)
-- ---------------------------------------------------------------
create table blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index on blocks (blocked_id);

-- ---------------------------------------------------------------
-- 6. 신고
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- 7. 밸런스게임 질문 (답은 저장하지 않는다 — SPEC 4.6)
-- ---------------------------------------------------------------
create table balance_questions (
  id       smallint primary key,
  option_a text not null,
  option_b text not null
);

-- ---------------------------------------------------------------
-- 8. 검색 결과 한 줄의 형태
-- ---------------------------------------------------------------
create type profile_card as (
  id         uuid,
  nickname   text,
  birth_year int,
  department text,
  gender     text,
  bio        text,
  photo_url  text,
  tag_labels text[]
);

-- ---------------------------------------------------------------
-- 9. 관리자 검토 대기 목록
--    서로 다른 신고자 3명 이상 = 검토 대기 (SPEC 4.5)
--    임계치가 이 SQL 한 줄에만 있으므로 숫자를 바꿀 때 고칠 곳이 한 군데다.
--    이 뷰는 002 에서 일반 사용자 접근을 막고, 003 의 관리자 RPC 로만 읽는다.
-- ---------------------------------------------------------------
create view report_queue as
select
  r.reported_id,
  count(distinct r.reporter_id)                as reporter_count,
  count(*) filter (where r.status = 'pending') as pending_count,
  max(r.created_at)                            as latest_at
from reports r
group by r.reported_id
having count(distinct r.reporter_id) >= 3;
