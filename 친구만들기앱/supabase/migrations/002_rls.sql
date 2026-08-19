-- 002_rls.sql — 행 수준 보안
--
-- RLS 는 여기서 보안 장치가 아니라 기능 요구사항이다.
-- blocks / reports 의 select 를 열어두면 브라우저 개발자 도구에서
-- "누가 나를 차단했는지 · 누가 나를 신고했는지"가 그대로 보이고,
-- SPEC 4.5 의 "상대에게 알리지 않는다"가 무너진다.

alter table profiles           enable row level security;
alter table profile_tags       enable row level security;
alter table friend_requests    enable row level security;
alter table conversations      enable row level security;
alter table messages           enable row level security;
alter table conversation_reads enable row level security;
alter table blocks             enable row level security;
alter table reports            enable row level security;
alter table interest_tags      enable row level security;
alter table balance_questions  enable row level security;

-- ---------------------------------------------------------------
-- 프로필 — 로그인한 사람은 모두 읽을 수 있다 (검색이 동작해야 하므로).
-- 쓰기는 본인만. 검색 시 차단·정지 제외는 search_profiles 함수가 처리한다.
-- ---------------------------------------------------------------
create policy profiles_read   on profiles for select to authenticated using (true);
create policy profiles_insert on profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on profiles for update to authenticated using (id = auth.uid());

-- 본인이 is_admin / suspended_until 을 스스로 바꾸지 못하게 막는다.
-- (profiles_update 만으로는 사용자가 자기 계정을 관리자로 승격시킬 수 있다)
create or replace function public.guard_privileged_columns()
returns trigger language plpgsql as $$
begin
  if auth.uid() = new.id then
    new.is_admin        := old.is_admin;
    new.suspended_until := old.suspended_until;
    new.suspend_reason  := old.suspend_reason;
  end if;
  return new;
end $$;

create trigger guard_privileged_columns_trigger
  before update on profiles
  for each row execute function public.guard_privileged_columns();

-- ---------------------------------------------------------------
-- 태그 연결 — 읽기는 전체, 쓰기는 본인 것만
-- ---------------------------------------------------------------
create policy ptags_read  on profile_tags for select to authenticated using (true);
create policy ptags_write on profile_tags for all    to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------------------------------------------------------------
-- 친구 신청 — 당사자만 본다.
-- 생성·수정은 security definer RPC 가 하므로 정책은 읽기만 연다.
-- ---------------------------------------------------------------
create policy freq_read on friend_requests for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- ---------------------------------------------------------------
-- 대화방과 메시지 — 참여자만
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- 차단 — 내가 건 차단만 보인다.
-- 상대는 자기가 차단당한 사실을 알 수 없어야 한다 (SPEC 4.5).
-- ---------------------------------------------------------------
create policy blocks_read on blocks for select to authenticated
  using (blocker_id = auth.uid());

-- ---------------------------------------------------------------
-- 신고 — 내가 낸 신고만 보인다. 관리자 화면은 003 의 RPC 로 조회한다.
-- ---------------------------------------------------------------
create policy reports_read on reports for select to authenticated
  using (reporter_id = auth.uid());

-- ---------------------------------------------------------------
-- 태그 목록 · 밸런스게임 질문 — 읽기만 공개, 쓰기 정책 없음
-- ---------------------------------------------------------------
create policy tags_read on interest_tags     for select to authenticated using (true);
create policy bq_read   on balance_questions for select to authenticated using (true);

-- ---------------------------------------------------------------
-- report_queue 뷰는 RLS 를 우회한다 (뷰는 소유자 권한으로 실행된다).
-- 일반 사용자가 직접 읽지 못하게 막고, 003 의 admin_report_queue() 로만 읽는다.
-- ---------------------------------------------------------------
revoke all on report_queue from anon, authenticated;
