-- 005_metrics.sql — 성공 지표 (SPEC 8장)
--
-- 주지표: 대화가 이어진 관계 수 = 수락 후 양쪽이 각각 3턴 이상 주고받은 관계.
-- 단순 수락 건수를 쓰지 않는 이유는 예의상 수락하고 대화 없이 끝난 경우가
-- 성공으로 잡히기 때문이다.
--
-- 003_functions.sql 의 admin_metrics() 가 이 뷰를 읽는다.
-- 003 을 먼저 실행해도 함수 생성은 성공한다(plpgsql 본문은 실행 시점에 해석된다).
-- 다만 admin_metrics() 를 호출하기 전에 이 파일을 반드시 실행해 둬야 한다.

create or replace view metrics_summary as
with turns as (
  select conversation_id, sender_id, count(*) as n
  from messages
  group by conversation_id, sender_id
),
active as (
  select conversation_id
  from turns
  group by conversation_id
  having count(*) = 2 and min(n) >= 3   -- 양쪽 모두 3턴 이상
)
select
  (select count(*) from profiles)                                  as 가입자수,
  (select count(*) from friend_requests)                           as 신청건수,
  (select count(*) from friend_requests where status = 'accepted') as 수락건수,
  (select count(*) from conversations)                             as 대화방수,
  (select count(*) from active)                                    as 대화이어진관계수,
  round(
    (select count(*) from friend_requests where status = 'accepted')::numeric
    / nullif((select count(*) from friend_requests), 0) * 100, 1)  as 수락률;

-- 뷰는 소유자 권한으로 실행되어 RLS 를 우회한다.
-- 일반 사용자가 전체 통계를 보지 못하게 막고, admin_metrics() 로만 읽는다.
revoke all on metrics_summary from anon, authenticated;
