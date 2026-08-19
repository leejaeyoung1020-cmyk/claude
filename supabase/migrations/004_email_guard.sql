-- 004_email_guard.sql — 학교 이메일 도메인 강제 (SPEC 4.1)
--
-- 이 트리거가 없으면 아무 이메일로나 가입된다.
-- 화면 쪽 검증(lib/validation.ts)만으로는 API 를 직접 호출하는 경우를 막지 못한다.

create or replace function public.enforce_school_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or lower(new.email) not like '%@kyonggi.ac.kr' then
    raise exception '경기대학교 이메일(@kyonggi.ac.kr)만 가입할 수 있습니다';
  end if;
  return new;
end $$;

drop trigger if exists enforce_school_email_trigger on auth.users;

create trigger enforce_school_email_trigger
  before insert on auth.users
  for each row execute function public.enforce_school_email();

-- ---------------------------------------------------------------
-- 확인 방법
--   1) SQL Editor 에서 아래를 실행하면 오류가 나야 정상이다.
--        insert into auth.users (id, email) values (gen_random_uuid(), 'x@gmail.com');
--   2) 오류 대신 행이 들어가면 트리거가 안 걸린 것이다.
--
-- 만약 auth 스키마에 트리거를 만들 권한이 없다는 오류가 나면:
--   - Supabase 대시보드의 Authentication > Hooks 에서
--     "Before User Created" 훅으로 같은 함수를 연결하는 방법이 대안이다.
--   - 그것도 막히면 화면 검증(lib/validation.ts)만 남는데,
--     이 경우 "API 직접 호출은 막지 못한다"는 한계를 SPEC 에 적어야 한다.
-- ---------------------------------------------------------------
