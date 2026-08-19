-- 003_functions.sql — 업무 규칙
--
-- 하루 신청 상한 5건, 차단 양방향 반영, 신고 임계치, 정지 판정은
-- 전부 이 파일 안에만 있다. 화면 코드는 이 함수들을 호출하기만 한다.
-- 화면에서 상한을 세거나 차단 여부를 판단하는 코드를 발견하면 그것은 버그다.
--
-- 오류 메시지는 사용자에게 그대로 보여줄 한국어로 쓴다.

-- ---------------------------------------------------------------
-- 검색 (SPEC 4.3)
--   자기 자신 · 차단 양방향 · 정지 중인 사람을 자동으로 제외한다.
--   태그는 OR 조건이다. 하나라도 겹치면 노출된다.
-- ---------------------------------------------------------------
create or replace function search_profiles(
  p_gender     text     default null,
  p_min_age    int      default 19,
  p_max_age    int      default 30,
  p_department text     default null,
  p_tag_ids    smallint[] default null,
  p_limit      int      default 20,
  p_offset     int      default 0
) returns setof profile_card
language sql security definer stable
set search_path = public
as $$
  select
    p.id, p.nickname, p.birth_year, p.department, p.gender, p.bio, p.photo_url,
    coalesce(
      array_agg(t.label order by t.label) filter (where t.label is not null),
      '{}'::text[]
    )
  from profiles p
  left join profile_tags  pt on pt.profile_id = p.id
  left join interest_tags t  on t.id = pt.tag_id
  where p.id <> auth.uid()
    and (p.suspended_until is null or p.suspended_until <= now())
    and not exists (
      select 1 from blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
    and (p_gender is null or p.gender = p_gender)
    and p.birth_year between (extract(year from now())::int - p_max_age)
                         and (extract(year from now())::int - p_min_age)
    and (p_department is null or p.department = p_department)
    and (p_tag_ids is null or cardinality(p_tag_ids) = 0
         or exists (select 1 from profile_tags f
                    where f.profile_id = p.id and f.tag_id = any(p_tag_ids)))
  group by p.id
  order by p.last_seen_at desc
  limit  greatest(1, least(p_limit, 100))
  offset greatest(0, p_offset);
$$;

-- ---------------------------------------------------------------
-- 오늘 남은 신청 횟수 (SPEC 4.4 — 하루 5건)
-- ---------------------------------------------------------------
create or replace function remaining_requests_today()
returns int
language sql security definer stable
set search_path = public
as $$
  select greatest(0, 5 - (
    select count(*)::int from friend_requests
    where sender_id = auth.uid()
      and created_at >= date_trunc('day', now())));
$$;

-- ---------------------------------------------------------------
-- 친구 신청 보내기
--   하루 5건 상한의 유일한 구현 위치다.
-- ---------------------------------------------------------------
create or replace function send_friend_request(p_receiver uuid, p_greeting text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_me    uuid := auth.uid();
  v_id    uuid;
  v_count int;
begin
  if v_me is null then
    raise exception '로그인이 필요합니다';
  end if;
  if v_me = p_receiver then
    raise exception '자기 자신에게는 신청할 수 없습니다';
  end if;
  if p_greeting is null or char_length(trim(p_greeting)) < 1 then
    raise exception '인사말을 입력해 주세요';
  end if;
  if char_length(p_greeting) > 200 then
    raise exception '인사말은 200자까지 쓸 수 있습니다';
  end if;

  if exists (select 1 from profiles
             where id = v_me and suspended_until > now()) then
    raise exception '정지 중에는 신청할 수 없습니다';
  end if;
  if exists (select 1 from profiles
             where id = p_receiver and suspended_until > now()) then
    raise exception '신청할 수 없는 상대입니다';
  end if;

  -- 차단은 양방향으로 막는다. 상대가 나를 차단한 경우에도
  -- "차단당했다"는 사실이 드러나지 않도록 같은 문구를 쓴다.
  if exists (select 1 from blocks
             where (blocker_id = v_me      and blocked_id = p_receiver)
                or (blocker_id = p_receiver and blocked_id = v_me)) then
    raise exception '신청할 수 없는 상대입니다';
  end if;

  if exists (select 1 from friend_requests
             where sender_id = v_me and receiver_id = p_receiver) then
    raise exception '이미 신청한 상대입니다';
  end if;

  select count(*) into v_count from friend_requests
  where sender_id = v_me and created_at >= date_trunc('day', now());
  if v_count >= 5 then
    raise exception '하루에 보낼 수 있는 신청은 5건입니다';
  end if;

  insert into friend_requests (sender_id, receiver_id, greeting)
  values (v_me, p_receiver, trim(p_greeting))
  returning id into v_id;

  return v_id;
end $$;

-- ---------------------------------------------------------------
-- 신청 수락 · 거절
--   수락이면 대화방을 만들고 그 id 를, 거절이면 null 을 돌려준다.
--   거절 사실은 신청자에게 노출하지 않는다 (화면에서 무응답과 같게 표시).
-- ---------------------------------------------------------------
create or replace function respond_friend_request(p_request uuid, p_accept boolean)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_me     uuid := auth.uid();
  v_sender uuid;
  v_a      uuid;
  v_b      uuid;
  v_conv   uuid;
begin
  select sender_id into v_sender
  from friend_requests
  where id = p_request and receiver_id = v_me and status = 'pending';

  if v_sender is null then
    raise exception '처리할 수 없는 신청입니다';
  end if;

  update friend_requests
     set status       = case when p_accept then 'accepted' else 'rejected' end,
         responded_at = now()
   where id = p_request;

  if not p_accept then
    return null;
  end if;

  v_a := least(v_me, v_sender);
  v_b := greatest(v_me, v_sender);

  insert into conversations (user_a, user_b)
  values (v_a, v_b)
  on conflict (user_a, user_b) do nothing;

  select id into v_conv from conversations where user_a = v_a and user_b = v_b;
  return v_conv;
end $$;

-- ---------------------------------------------------------------
-- 차단 (SPEC 4.5)
--   제재가 아니다. 횟수를 세지 않고 아무 기록도 남기지 않는다.
-- ---------------------------------------------------------------
create or replace function block_user(p_target uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() = p_target then
    raise exception '차단할 수 없습니다';
  end if;
  insert into blocks (blocker_id, blocked_id)
  values (auth.uid(), p_target)
  on conflict do nothing;
end $$;

create or replace function unblock_user(p_target uuid)
returns void
language sql security definer
set search_path = public
as $$
  delete from blocks where blocker_id = auth.uid() and blocked_id = p_target;
$$;

-- ---------------------------------------------------------------
-- 신고 (SPEC 4.5)
--   신고하면 두 사람은 자동으로 상호 차단된다.
--   누적으로 자동 정지하지 않는다. 정지는 관리자만 한다.
-- ---------------------------------------------------------------
create or replace function report_user(p_target uuid, p_reason text, p_detail text default null)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null or v_me = p_target then
    raise exception '신고할 수 없습니다';
  end if;
  if exists (select 1 from reports where reporter_id = v_me and reported_id = p_target) then
    raise exception '이미 신고한 상대입니다';
  end if;

  insert into reports (reporter_id, reported_id, reason, detail)
  values (v_me, p_target, p_reason, p_detail)
  returning id into v_id;

  insert into blocks (blocker_id, blocked_id) values (v_me, p_target)  on conflict do nothing;
  insert into blocks (blocker_id, blocked_id) values (p_target, v_me)  on conflict do nothing;

  return v_id;
end $$;

-- ---------------------------------------------------------------
-- 읽음 처리
--   내가 어디까지 읽었는지만 저장한다. 상대에게는 노출되지 않는다.
-- ---------------------------------------------------------------
create or replace function mark_conversation_read(p_conversation uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (select 1 from conversations c
                 where c.id = p_conversation
                   and (c.user_a = auth.uid() or c.user_b = auth.uid())) then
    raise exception '접근할 수 없는 대화방입니다';
  end if;

  insert into conversation_reads (conversation_id, user_id, last_read_at)
  values (p_conversation, auth.uid(), now())
  on conflict (conversation_id, user_id)
  do update set last_read_at = now();
end $$;

-- ---------------------------------------------------------------
-- 관리자 — 검토 대기 목록
--   report_queue 뷰는 RLS 를 우회하므로 반드시 이 함수를 거쳐 읽는다.
-- ---------------------------------------------------------------
create or replace function admin_report_queue()
returns table (
  reported_id    uuid,
  nickname       text,
  department     text,
  reporter_count bigint,
  pending_count  bigint,
  latest_at      timestamptz,
  reasons        text[],
  suspended_until timestamptz
)
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception '관리자만 볼 수 있습니다';
  end if;

  return query
  select q.reported_id,
         p.nickname,
         p.department,
         q.reporter_count,
         q.pending_count,
         q.latest_at,
         array(select distinct r.reason from reports r where r.reported_id = q.reported_id),
         p.suspended_until
  from report_queue q
  join profiles p on p.id = q.reported_id
  order by q.reporter_count desc, q.latest_at desc;
end $$;

-- ---------------------------------------------------------------
-- 관리자 — 신고 처리
--   dismissed(기각) / warned(경고) / suspended(정지)
--   화면에서 숨기는 것만으로는 부족하므로 여기서 다시 권한을 확인한다.
-- ---------------------------------------------------------------
create or replace function admin_resolve_report(p_reported uuid, p_action text, p_days int default 30)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_me uuid := auth.uid();
begin
  if not exists (select 1 from profiles where id = v_me and is_admin) then
    raise exception '관리자만 처리할 수 있습니다';
  end if;
  if p_action not in ('dismissed','warned','suspended') then
    raise exception '알 수 없는 처리입니다';
  end if;
  if p_action = 'suspended' and (p_days is null or p_days < 1 or p_days > 365) then
    raise exception '정지 기간은 1일에서 365일 사이여야 합니다';
  end if;

  update reports
     set status      = p_action,
         reviewed_at = now(),
         reviewed_by = v_me
   where reported_id = p_reported and status = 'pending';

  if p_action = 'suspended' then
    update profiles
       set suspended_until = now() + make_interval(days => p_days),
           suspend_reason  = '신고가 누적되어 관리자 검토 후 이용이 제한되었습니다'
     where id = p_reported;
  end if;
end $$;

-- ---------------------------------------------------------------
-- 관리자 — 성공 지표 (SPEC 8장)
-- ---------------------------------------------------------------
create or replace function admin_metrics()
returns table (
   가입자수 bigint, 신청건수 bigint, 수락건수 bigint,
  대화방수 bigint, 대화이어진관계수 bigint, 수락률 numeric
)
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception '관리자만 볼 수 있습니다';
  end if;
  return query select * from metrics_summary;
end $$;

-- ---------------------------------------------------------------
-- 실행 권한
-- ---------------------------------------------------------------
grant execute on function
  search_profiles(text,int,int,text,smallint[],int,int),
  remaining_requests_today(),
  send_friend_request(uuid,text),
  respond_friend_request(uuid,boolean),
  block_user(uuid), unblock_user(uuid),
  report_user(uuid,text,text),
  mark_conversation_read(uuid),
  admin_report_queue(),
  admin_resolve_report(uuid,text,int),
  admin_metrics()
to authenticated;
