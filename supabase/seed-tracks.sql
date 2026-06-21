-- =============================================
-- 테스트 곡 4개 추가 + 오늘 플레이리스트에 연결
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 곡 4개 추가
insert into tracks (title, artist_name, album_name, album_image_url, spotify_url, apple_music_url, youtube_music_url, melon_url, recommendation_comment)
values
(
  'APT.',
  'ROSÉ, Bruno Mars',
  'rosie',
  'https://upload.wikimedia.org/wikipedia/en/c/c8/Ros%C3%A9_and_Bruno_Mars_-_Apt..png',
  'https://open.spotify.com/track/5vNRhkKd0yEAg8suGBpjeY',
  'https://music.apple.com/kr/album/apt/1773490062?i=1773490063',
  'https://music.youtube.com/watch?v=ekr2nIex040',
  'https://www.melon.com/song/detail.htm?songId=37360030',
  '중독성 있는 멜로디와 함께 기분 전환하기 좋은 곡이에요.'
),
(
  'Supernova',
  'aespa',
  'Armageddon - The 1st Album',
  'https://upload.wikimedia.org/wikipedia/en/8/80/Aespa_-_Supernova.png',
  'https://open.spotify.com/track/45RYjkliKRHFgDCBjhCVKV',
  'https://music.apple.com/kr/album/supernova/1745572880?i=1745572886',
  'https://music.youtube.com/watch?v=pClGmht_oZo',
  'https://www.melon.com/song/detail.htm?songId=37089344',
  '강렬한 에너지가 필요한 아침에 딱 맞는 곡!'
),
(
  'Magnetic',
  'ILLIT',
  'SUPER REAL ME',
  'https://upload.wikimedia.org/wikipedia/en/3/3b/Illit_-_Super_Real_Me.png',
  'https://open.spotify.com/track/2FDTHlrBguDgp4sTawiMVe',
  'https://music.apple.com/kr/album/magnetic/1733498035?i=1733498040',
  'https://music.youtube.com/watch?v=Vk5-c_v4gMU',
  'https://www.melon.com/song/detail.htm?songId=37017773',
  '상큼하고 설레는 감성, 봄에 듣기 좋은 곡이에요.'
),
(
  'Whiplash',
  'aespa',
  'Whiplash - The 5th Mini Album',
  'https://upload.wikimedia.org/wikipedia/en/6/6e/Aespa_-_Whiplash.png',
  'https://open.spotify.com/track/73TBn8VLG4jRqkVENOFGHs',
  'https://music.apple.com/kr/album/whiplash/1773079498?i=1773079788',
  'https://music.youtube.com/watch?v=jWbbhJ5FjWs',
  'https://www.melon.com/song/detail.htm?songId=37340498',
  '파워풀한 비트와 퍼포먼스가 돋보이는 곡!'
);

-- 오늘 플레이리스트에 새 곡들 연결 (display_order 2, 3 추가)
-- 기존 1번(Die With A Smile)은 유지하고, 2·3번 슬롯에 추가
insert into daily_playlist_items (daily_playlist_id, track_id, display_order)
values
(
  (select id from daily_playlists where playlist_date = current_date),
  (select id from tracks where title = 'APT.'),
  2
),
(
  (select id from daily_playlists where playlist_date = current_date),
  (select id from tracks where title = 'Supernova'),
  3
);

-- 내일 플레이리스트도 생성 (테스트용)
insert into daily_playlists (playlist_date, title, status)
values (current_date + 1, '내일의 추천', 'published');

insert into daily_playlist_items (daily_playlist_id, track_id, display_order)
values
(
  (select id from daily_playlists where playlist_date = current_date + 1),
  (select id from tracks where title = 'Magnetic'),
  1
),
(
  (select id from daily_playlists where playlist_date = current_date + 1),
  (select id from tracks where title = 'Whiplash'),
  2
);
