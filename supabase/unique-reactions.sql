-- 유저별 음악당 1개 리액션 테이블
CREATE TABLE IF NOT EXISTS public.unique_reactions (
  track_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (track_id, user_id)
);

-- 카운트 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_unique_reactions_track ON unique_reactions(track_id);

-- RLS
ALTER TABLE unique_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read unique_reactions"
  ON unique_reactions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert unique_reactions"
  ON unique_reactions FOR INSERT WITH CHECK (true);

-- 트랙별 리액션 카운트 조회 RPC
CREATE OR REPLACE FUNCTION get_reaction_count(p_track_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM unique_reactions WHERE track_id = p_track_id;
$$ LANGUAGE sql STABLE;

-- 리액션 등록 (유저당 1개, 중복 무시) — service_role 전용
CREATE OR REPLACE FUNCTION record_reaction(p_track_id TEXT, p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO unique_reactions (track_id, user_id)
  VALUES (p_track_id, p_user_id)
  ON CONFLICT (track_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- service_role만 record_reaction 실행 가능
REVOKE ALL ON FUNCTION record_reaction FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_reaction TO service_role;
