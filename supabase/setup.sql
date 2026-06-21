-- =============================================
-- 오늘의 한 곡 - MVP 테이블 생성
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. tracks: 곡 정보
create table if not exists tracks (
  id bigint generated always as identity primary key,
  title text not null,
  artist_name text not null,
  album_name text,
  album_image_url text,
  apple_music_url text,
  melon_url text,
  youtube_music_url text,
  spotify_url text,
  recommendation_comment text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. daily_playlists: 날짜별 플레이리스트
create table if not exists daily_playlists (
  id bigint generated always as identity primary key,
  playlist_date date not null unique,
  title text default '오늘의 추천',
  status text default 'published' check (status in ('draft', 'scheduled', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. daily_playlist_items: 플레이리스트-곡 매핑 (최대 3곡)
create table if not exists daily_playlist_items (
  id bigint generated always as identity primary key,
  daily_playlist_id bigint not null references daily_playlists(id) on delete cascade,
  track_id bigint not null references tracks(id) on delete cascade,
  display_order int not null default 1 check (display_order between 1 and 3),
  created_at timestamptz default now(),
  unique (daily_playlist_id, track_id),
  unique (daily_playlist_id, display_order)
);

-- 4. RLS(Row Level Security) 설정 - 읽기 전용 공개
alter table tracks enable row level security;
alter table daily_playlists enable row level security;
alter table daily_playlist_items enable row level security;

create policy "tracks_read" on tracks for select using (true);
create policy "daily_playlists_read" on daily_playlists for select using (true);
create policy "daily_playlist_items_read" on daily_playlist_items for select using (true);

-- =============================================
-- 테스트 데이터 삽입
-- =============================================

-- 곡 추가
insert into tracks (title, artist_name, album_name, album_image_url, spotify_url, apple_music_url, youtube_music_url, melon_url, recommendation_comment)
values (
  'Die With A Smile',
  'Lady Gaga, Bruno Mars',
  'Die With A Smile',
  'https://upload.wikimedia.org/wikipedia/en/6/6e/Lady_Gaga_and_Bruno_Mars_-_Die_with_a_Smile.png',
  'https://open.spotify.com/track/0V3eVNmgkOzJ5wQztnCpAV?si=c286e4941d884b99',
  'https://music.apple.com/kr/album/die-with-a-smile/1762656251?i=1762656252',
  'https://music.youtube.com/watch?v=kTJczUoc26U',
  'https://www.melon.com/song/detail.htm?songId=37213019',
  '따뜻하고 감성적인 듀엣곡, 오늘 하루를 마무리하며 들어보세요.'
);

-- 오늘 날짜 플레이리스트 생성
insert into daily_playlists (playlist_date, title, status)
values (current_date, '오늘의 추천', 'published');

-- 플레이리스트에 곡 연결
insert into daily_playlist_items (daily_playlist_id, track_id, display_order)
values (
  (select id from daily_playlists where playlist_date = current_date),
  (select id from tracks where title = 'Die With A Smile'),
  1
);
