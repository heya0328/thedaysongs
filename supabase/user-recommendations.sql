-- 유저 추천곡 테이블
-- 유저가 추천 퍼널에서 제출한 곡 정보를 저장합니다.
-- recommend_date 기준으로 해당 날짜의 추천곡을 조회합니다.

CREATE TABLE IF NOT EXISTS user_recommendations (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  artist_name text NOT NULL,
  image_url text,
  platform text NOT NULL,
  original_url text NOT NULL,
  story text,
  recommend_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- RLS 설정
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "read_recommendations"
  ON user_recommendations FOR SELECT
  USING (true);

-- anon key로 insert 허용 (클라이언트에서 직접 저장)
CREATE POLICY "insert_recommendations"
  ON user_recommendations FOR INSERT
  WITH CHECK (true);

-- 날짜별 조회 최적화 인덱스
CREATE INDEX idx_recommendations_date ON user_recommendations (recommend_date, created_at ASC);

COMMENT ON TABLE user_recommendations IS '유저가 추천한 곡 정보. recommend_date 기준으로 당일 추천곡 조회';
