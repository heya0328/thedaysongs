// ---- ResultPage ----
export const MAX_CONCURRENT_REACTIONS = 20;
export const REACTION_TIMEOUT_MS = 2400;
export const BG_CROSSFADE_MS = 500;

// ---- AlbumCarousel ----
export const CAROUSEL_CARD_SIZE = 260;
export const SWIPE_THRESHOLD = 60;
export const VELOCITY_THRESHOLD = 0.3;
export const RUBBER_BAND_FACTOR = 0.25;

// ---- AlbumTicker ----
export const TICKER_CARD_SIZE = 140;
export const TICKER_CARD_GAP = 12;
export const TICKER_CARD_RADIUS = 10;

// ---- tracks.ts ----
export const CAROUSEL_MAX = 5;
export const SERVICE_START_DATE = '2026-04-14';
export const TRACK_CACHE_KEY = 'thedaysongs_today_track';

// ---- useReactionChannel ----
export const SEND_THROTTLE_MS = 1500;

// ---- RecommendStoryPage ----
export const STORY_MAX_LENGTH = 200;

// ---- ResultPage platform list ----
export const PLATFORM_LIST = [
  { key: 'apple-music', label: 'Apple Music에서 듣기', icon: '/Apple_Music_icon.svg' },
  { key: 'youtube-music', label: 'Youtube Music에서 듣기', icon: '/Youtube_Music_icon.svg' },
  { key: 'youtube', label: 'Youtube에서 보기', icon: '/Youtube_Music_icon.svg' },
  { key: 'spotify', label: 'Spotify에서 듣기', icon: '/Spotify_icon.svg' },
  { key: 'melon', label: 'Melon에서 듣기', icon: '/melon.svg' },
] as const;

// ---- Recommendations cache ----
export const RECS_CACHE_KEY = 'thedaysongs_today_recs';
