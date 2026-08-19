-- seed.sql — 개발·시연용 기초 데이터
--
-- 001~005 를 모두 실행한 뒤 마지막에 실행한다.
-- 여기서 만드는 더미 계정 20개 덕분에 B·C·D 가 서로를 기다리지 않고
-- 동시에 화면 작업을 시작할 수 있다.
--
-- 더미 계정은 로그인할 수 없다 (비밀번호 자리에 사용 불가능한 값을 넣는다).
-- 화면에 데이터를 채우는 용도이지 실제 사용자가 아니다.

-- ---------------------------------------------------------------
-- 1. 관심사 태그 20개 (SPEC 4.2 — 고정 목록)
-- ---------------------------------------------------------------
insert into interest_tags (id, label) values
  ( 1, '운동·헬스'),      ( 2, '러닝'),          ( 3, '등산'),
  ( 4, '게임'),           ( 5, '영화'),          ( 6, '음악'),
  ( 7, '독서'),           ( 8, '카페'),          ( 9, '맛집'),
  (10, '여행'),           (11, '사진'),          (12, '그림'),
  (13, '요리'),           (14, '반려동물'),      (15, '공모전·대외활동'),
  (16, '어학·교환학생'),  (17, '자격증·스터디'), (18, '창업'),
  (19, '코딩'),           (20, '보드게임')
on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- 2. 밸런스게임 질문 30개 (SPEC 4.6)
--    정치·종교·외모·연애 경험에 관한 질문은 넣지 않는다.
-- ---------------------------------------------------------------
insert into balance_questions (id, option_a, option_b) values
  ( 1, '평생 여름만',            '평생 겨울만'),
  ( 2, '아침형 인간',            '저녁형 인간'),
  ( 3, '계획 세우고 여행',       '무작정 떠나는 여행'),
  ( 4, '산',                     '바다'),
  ( 5, '치킨',                   '피자'),
  ( 6, '민트초코 좋아함',        '민트초코 싫어함'),
  ( 7, '탕수육 부먹',            '탕수육 찍먹'),
  ( 8, '라면에 계란',            '라면에 파'),
  ( 9, '시험 전날 밤새기',       '일찍 자고 새벽에 하기'),
  (10, '조별과제 조장 하기',     '조별과제 조원 하기'),
  (11, '1교시 수업',             '야간 수업'),
  (12, '학식',                   '밖에서 사 먹기'),
  (13, '공부는 도서관에서',      '공부는 카페에서'),
  (14, '벼락치기',               '미리미리'),
  (15, '국내 여행',              '해외 여행'),
  (16, '돈 많은 백수',           '바쁘지만 좋아하는 일'),
  (17, '과거로 가기',            '미래로 가기'),
  (18, '하늘 날기',              '물속에서 숨쉬기'),
  (19, '평생 한 가지 음식만',    '평생 같은 옷만'),
  (20, '유명해지기',             '조용히 살기'),
  (21, '강아지',                 '고양이'),
  (22, '노래방에서 발라드',      '노래방에서 신나는 곡'),
  (23, '영화관 맨 앞줄',         '영화관 맨 뒷줄'),
  (24, '넷플릭스 정주행',        '매주 한 편씩 보기'),
  (25, '여행 갈 때 캐리어',      '여행 갈 때 배낭'),
  (26, '카톡 답장 즉시',         '카톡 답장 몰아서'),
  (27, '알람 한 번에 일어나기',  '알람 다섯 번 미루기'),
  (28, '매운 거',                '단 거'),
  (29, '아이스 아메리카노',      '따뜻한 라떼'),
  (30, '방 청소는 몰아서',       '방 청소는 매일 조금씩')
on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- 3. 더미 사용자 20명
--
--    [확인 필요] 학과명은 임시 목록이다.
--    경기대학교 홈페이지의 실제 학과명으로 교체해야 한다.
--    교체할 곳은 아래 department 값과, 화면의 학과 선택 목록 두 군데다.
-- ---------------------------------------------------------------
do $$
declare
  r      record;
  v_id   uuid;
  v_seq  int := 0;
begin
  for r in
    select * from (values
      ('민준', 2002, '컴퓨터공학부',     'male',   '같이 헬스장 갈 사람 구해요',        array[1,9,19]::smallint[]),
      ('서연', 2003, '경영학과',         'female', '카페 투어 같이 다녀요',             array[8,9,11]::smallint[]),
      ('도윤', 2001, '기계시스템공학과', 'male',   '주말에 등산 갈 사람!',              array[3,2,9]::smallint[]),
      ('하은', 2004, '미디어영상학과',   'female', '영화 얘기 하고 싶어요',             array[5,11,7]::smallint[]),
      ('시우', 2000, '전자공학과',       'male',   '공모전 팀원 찾습니다',              array[15,19,18]::smallint[]),
      ('지아', 2003, '영어영문학과',     'female', '교환학생 준비 같이 해요',           array[16,7,10]::smallint[]),
      ('예준', 2002, '경제학과',         'male',   '보드게임 좋아하면 연락 주세요',     array[20,4,9]::smallint[]),
      ('수아', 2001, '심리학과',         'female', '독서모임 하실 분',                  array[7,8,6]::smallint[]),
      ('주원', 2004, '건축학과',         'male',   '사진 찍으러 다녀요',                array[11,10,5]::smallint[]),
      ('지우', 2002, '관광경영학과',     'female', '맛집 탐방 같이 갈 사람',            array[9,10,8]::smallint[]),
      ('건우', 1999, '산업경영공학과',   'male',   '창업 준비 중입니다',                array[18,15,17]::smallint[]),
      ('유나', 2003, '국어국문학과',     'female', '글쓰기 좋아해요',                   array[7,12,8]::smallint[]),
      ('현우', 2001, '화학공학과',       'male',   '러닝 크루 만들어요',                array[2,1,13]::smallint[]),
      ('소율', 2004, '응용통계학과',     'female', '코딩 스터디 구해요',                array[19,17,4]::smallint[]),
      ('정우', 2000, '법학과',           'male',   '자격증 같이 준비해요',              array[17,7,1]::smallint[]),
      ('나윤', 2002, '생명과학과',       'female', '반려견 산책 메이트 찾아요',         array[14,2,8]::smallint[]),
      ('민재', 2003, '행정학과',         'male',   '음악 페스티벌 같이 가요',           array[6,10,5]::smallint[]),
      ('채원', 2001, '회계세무학과',     'female', '요리 배우고 있어요',                array[13,9,14]::smallint[]),
      ('준호', 2004, '도시·교통공학과',  'male',   '게임 같이 하실 분',                 array[4,20,19]::smallint[]),
      ('다인', 2002, '스포츠과학부',     'female', '같이 운동할 사람 구해요',           array[1,2,3]::smallint[])
    ) as t(nickname, birth_year, department, gender, bio, tags)
  loop
    v_seq := v_seq + 1;
    v_id  := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_id, 'authenticated', 'authenticated',
      'demo' || v_seq || '@kyonggi.ac.kr',
      'DUMMY-NO-LOGIN',                       -- 로그인 불가능한 값
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"seed":true}'::jsonb,
      false, '', '', '', ''
    );

    insert into profiles (id, nickname, birth_year, department, gender, bio, last_seen_at)
    values (v_id, r.nickname, r.birth_year, r.department, r.gender, r.bio,
            now() - (v_seq || ' hours')::interval);

    insert into profile_tags (profile_id, tag_id)
    select v_id, unnest(r.tags);
  end loop;
end $$;

-- ---------------------------------------------------------------
-- 4. 더미 친구 신청 5건 (전부 대기 상태)
-- ---------------------------------------------------------------
insert into friend_requests (sender_id, receiver_id, greeting)
select s.id, v.id, g.greeting
from (values
  ('민준','서연','안녕하세요! 카페 투어 같이 다니고 싶어서 연락드려요'),
  ('도윤','다인','등산 좋아하신다면 주말에 같이 가실래요?'),
  ('시우','소율','공모전 팀원 구하는데 통계 쪽 관심 있으신가요?'),
  ('예준','정우','보드게임 모임 하는데 혹시 관심 있으세요?'),
  ('현우','나윤','아침 러닝 같이 하실 분 찾고 있어요!')
) as g(sender, receiver, greeting)
join profiles s on s.nickname = g.sender
join profiles v on v.nickname = g.receiver
on conflict do nothing;

-- ---------------------------------------------------------------
-- 5. 수락된 대화방 1개 + 메시지 6개 (양쪽 3턴씩)
--    양쪽 3턴이므로 metrics_summary 의 "대화이어진관계수"가 1이 된다.
--    D 가 채팅 화면을 만들 때 바로 쓸 수 있고, 지표 화면도 0이 아니게 된다.
-- ---------------------------------------------------------------
do $$
declare
  v_x uuid; v_y uuid; v_a uuid; v_b uuid; v_conv uuid;
begin
  select id into v_x from profiles where nickname = '하은';
  select id into v_y from profiles where nickname = '주원';
  v_a := least(v_x, v_y);
  v_b := greatest(v_x, v_y);

  insert into friend_requests (sender_id, receiver_id, greeting, status, responded_at)
  values (v_x, v_y, '사진 찍으러 다니신다길래 연락드려요!', 'accepted', now() - interval '2 days')
  on conflict do nothing;

  insert into conversations (user_a, user_b, created_at)
  values (v_a, v_b, now() - interval '2 days')
  on conflict (user_a, user_b) do nothing;

  select id into v_conv from conversations where user_a = v_a and user_b = v_b;

  insert into messages (conversation_id, sender_id, body, created_at) values
    (v_conv, v_x, '안녕하세요! 수락해 주셔서 감사해요',            now() - interval '2 days'),
    (v_conv, v_y, '안녕하세요 :) 사진 자주 찍으세요?',             now() - interval '2 days' + interval '5 min'),
    (v_conv, v_x, '네 요즘 필름 카메라 배우는 중이에요',           now() - interval '2 days' + interval '9 min'),
    (v_conv, v_y, '오 저도 필름 써봤는데 현상비가 만만찮더라고요', now() - interval '1 day'),
    (v_conv, v_x, '맞아요 ㅋㅋ 그래도 결과물 보면 기분 좋아요',    now() - interval '1 day' + interval '3 min'),
    (v_conv, v_y, '이번 주말에 시간 되면 같이 출사 가실래요?',     now() - interval '3 hours');
end $$;

-- ---------------------------------------------------------------
-- 확인
--   select count(*) from profiles;           -- 20
--   select count(*) from interest_tags;      -- 20
--   select count(*) from balance_questions;  -- 30
--   select count(*) from friend_requests;    -- 6 (대기 5 + 수락 1)
--   select count(*) from messages;           -- 6
--   select * from metrics_summary;           -- 대화이어진관계수 = 1
-- ---------------------------------------------------------------
