-- =============================================
-- 앨범 이미지 URL 수정 (Apple Music CDN 사용)
-- Supabase SQL Editor에서 실행하세요
-- =============================================

update tracks set album_image_url = 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ba/57/3f/ba573fb9-9184-c784-4545-a83c337c2531/artwork.jpg/600x600bb.jpg'
where title = 'Die With A Smile';

update tracks set album_image_url = 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2d/1a/7d/2d1a7d91-587e-0ceb-d434-327bd66d9e86/075679628312.jpg/600x600bb.jpg'
where title = 'APT.';

update tracks set album_image_url = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/50/7e/e0/507ee09f-ccfd-1e3c-af90-ca5e92b1221b/00888735949869_Cover.jpg/600x600bb.jpg'
where title = 'Supernova';

update tracks set album_image_url = 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3e/49/1e/3e491e43-4961-21ab-2abe-37fb1c0feb40/196922879227_Cover.jpg/600x600bb.jpg'
where title = 'Magnetic';

update tracks set album_image_url = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d5/c1/f5/d5c1f505-f588-775f-df05-c672a8ec22e9/888735949562_Cover.jpg/600x600bb.jpg'
where title = 'Whiplash';
