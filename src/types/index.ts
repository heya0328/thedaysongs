// ---- Track & carousel types (from data/tracks.ts) ----

export interface Track {
  id: string;
  title: string;
  artistName: string;
  albumName: string;
  albumImageUrl: string;
  recommendationComment?: string;
  appleMusicUrl?: string;
  melonUrl?: string;
  youtubeMusicUrl?: string;
  spotifyUrl?: string;
  youtubeLink?: string;
  /** 유저 추천곡인 경우 원본 URL */
  originalUrl?: string;
  /** 유저 추천곡인 경우 플랫폼 (spotify, apple-music, youtube-music, youtube, melon) */
  platform?: string;
}

export interface TodayTrack {
  date: string;
  track: Track;
}

export interface CarouselData {
  /** 캐러셀에 표시할 트랙 (최대 5개) */
  carouselTracks: Track[];
  /** 오늘의 전체 트랙 (overflow 바텀시트용) */
  allTracks: Track[];
  /** 초기 포커스 인덱스 */
  defaultIndex: number;
}

// ---- Recommendation types (from data/recommendations.ts) ----

export interface UserRecommendation {
  id: number;
  title: string;
  artistName: string;
  imageUrl: string | null;
  platform: string;
  originalUrl: string;
  story: string | null;
  recommendDate: string;
  createdAt: string;
}

// ---- Recommend funnel types (from pages/recommend/types.ts) ----

/** 퍼널 전체에서 공유되는 추천 데이터 */
export interface RecommendData {
  /** 유저가 입력한 원본 음악 링크 */
  url: string;
  /** 파싱된 곡 제목 */
  title: string;
  /** 파싱된 아티스트 */
  artist: string;
  /** 파싱된 앨범 아트 이미지 URL */
  imageUrl: string;
  /** 감지된 플랫폼 */
  platform: string;
  /** 유저가 작성한 사연 (선택) */
  story?: string;
}

// ---- Reaction types (from pages/ResultPage.tsx) ----

export type EmojiConfig = {
  key: string;
  iconName: string;
  glow: string;
};

export type FloatingPiece = {
  id: string;
  iconName: string;
  frameSize: number;
  iconScale: number;
  startX: number;
  driftX: number;
  lift: number;
  rotate: number;
  delay: number;
  duration: number;
  popScale: number;
  endScale: number;
};

export type OrbitRing = {
  id: string;
  size: number;
  rotate: number;
  duration: number;
};

export type ReactionParticle = {
  id: number;
  config: EmojiConfig;
  offsetX: number;
  offsetY: number;
  burstSize: number;
  pieces: FloatingPiece[];
  rings: OrbitRing[];
};

// ---- Reaction channel types (from lib/reactions/useReactionChannel.ts) ----

export type ReactionMessage = { key: string; senderId: string };
