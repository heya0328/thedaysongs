import { supabase } from '../lib/supabase';
import type { RecommendData, Track, UserRecommendation } from '../types';
import { RECS_CACHE_KEY } from '../constants';

/** 로컬 시간 기준 오늘 날짜 (YYYY-MM-DD) */
function getLocalToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type { UserRecommendation };

/**
 * Apple Music og:title이 "Apple Music에서 만나는 {아티스트}의 {제목}" 형식으로
 * 저장된 경우 제목과 아티스트를 분리한다.
 */
function normalizeAppleMusicTitle(
  rawTitle: string,
  rawArtist: string,
): { title: string; artistName: string } {
  const normalized = rawTitle.replace(/\u00a0/g, ' ');
  const match = normalized.match(/^Apple\s+Music에서\s+만나는\s+(.+?)의\s+(.+)$/);
  if (match) {
    return { title: match[2], artistName: match[1] };
  }
  const matchNoSong = normalized.match(/^Apple\s+Music에서\s+만나는\s+(.+)$/);
  if (matchNoSong) {
    return { title: normalized, artistName: matchNoSong[1] };
  }
  return { title: rawTitle, artistName: rawArtist };
}

function mapRow(row: Record<string, unknown>): UserRecommendation {
  const { title, artistName } = normalizeAppleMusicTitle(
    row.title as string,
    row.artist_name as string,
  );
  return {
    id: row.id as number,
    title,
    artistName,
    imageUrl: row.image_url as string | null,
    platform: row.platform as string,
    originalUrl: row.original_url as string,
    story: row.story as string | null,
    recommendDate: row.recommend_date as string,
    createdAt: row.created_at as string,
  };
}

/** 같은 (title, artistName) 조합의 중복을 제거한다. 먼저 등록된 것을 유지. */
function deduplicateRecommendations(recs: UserRecommendation[]): UserRecommendation[] {
  const seen = new Set<string>();
  return recs.filter((rec) => {
    const key = `${rec.title.toLowerCase().trim()}::${rec.artistName.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** UserRecommendation → Track 변환 */
export function userRecommendationToTrack(rec: UserRecommendation): Track {
  return {
    id: `user-${rec.id}`,
    title: rec.title,
    artistName: rec.artistName,
    albumName: '',
    albumImageUrl: rec.imageUrl ?? '',
    recommendationComment: rec.story ?? undefined,
    originalUrl: rec.originalUrl,
    platform: rec.platform,
  };
}

/** 사연 텍스트의 비속어를 서버에서 마스킹 처리 */
async function maskStory(text: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('mask-profanity', {
      body: { text },
    });
    if (error) return text;
    // data가 이미 파싱된 객체일 수도, 문자열일 수도 있음
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsed?.masked) return parsed.masked;
  } catch { /* 마스킹 실패 시 원본 사용 */ }
  return text;
}

/** 오늘 동일한 (title, artist) 조합의 추천이 이미 있는지 확인 */
export async function checkDuplicateRecommendation(
  title: string,
  artist: string,
): Promise<boolean> {
  const today = getLocalToday();

  const { data, error } = await supabase
    .from('user_recommendations')
    .select('id')
    .eq('recommend_date', today)
    .ilike('title', title.trim())
    .ilike('artist_name', artist.trim())
    .limit(1);

  if (error || !data) return false;
  return data.length > 0;
}

/** 추천 데이터를 user_recommendations 테이블에 저장 */
export async function submitRecommendation(data: RecommendData): Promise<void> {
  // 중복 체크: 같은 날 동일 제목+아티스트 조합이 있으면 차단
  const isDuplicate = await checkDuplicateRecommendation(data.title, data.artist);
  if (isDuplicate) {
    throw new Error('duplicate_recommendation');
  }

  const story = data.story ? await maskStory(data.story) : null;

  const { error } = await supabase.from('user_recommendations').insert({
    title: data.title,
    artist_name: data.artist,
    image_url: data.imageUrl,
    platform: data.platform,
    original_url: data.url,
    story,
    recommend_date: getLocalToday(),
  });

  if (error) {
    throw new Error(`추천 저장 실패: ${error.message}`);
  }
}

interface RecsCacheEntry {
  date: string;
  recommendations: UserRecommendation[];
}

function getRecsCached(): UserRecommendation[] | null {
  try {
    const raw = sessionStorage.getItem(RECS_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as RecsCacheEntry;
    const today = getLocalToday();
    if (cached.date === today) return cached.recommendations;
    sessionStorage.removeItem(RECS_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

let recsInFlightRequest: Promise<UserRecommendation[]> | null = null;

/** 오늘 추천된 곡 전체 조회 (created_at 오름차순) */
export async function fetchTodayRecommendations(): Promise<UserRecommendation[]> {
  const cached = getRecsCached();
  if (cached) return cached;

  if (recsInFlightRequest) return recsInFlightRequest;

  recsInFlightRequest = fetchRecsFromSupabase();
  try {
    return await recsInFlightRequest;
  } finally {
    recsInFlightRequest = null;
  }
}

async function fetchRecsFromSupabase(): Promise<UserRecommendation[]> {
  const today = getLocalToday();

  const { data, error } = await supabase
    .from('user_recommendations')
    .select('*')
    .eq('recommend_date', today)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  const recommendations = deduplicateRecommendations(
    (data as Record<string, unknown>[]).map(mapRow),
  );

  try {
    const entry: RecsCacheEntry = { date: today, recommendations };
    sessionStorage.setItem(RECS_CACHE_KEY, JSON.stringify(entry));
  } catch { /* storage full — 무시 */ }

  return recommendations;
}

/** 추천 캐시를 무효화한다 (새 추천 등록 후 호출) */
export function invalidateRecsCache(): void {
  try {
    sessionStorage.removeItem(RECS_CACHE_KEY);
  } catch { /* ignore */ }
}

/** 오늘 가장 최근에 추천된 곡 1건 */
export async function fetchFeaturedRecommendation(): Promise<UserRecommendation | null> {
  const today = getLocalToday();

  const { data, error } = await supabase
    .from('user_recommendations')
    .select('*')
    .eq('recommend_date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}
