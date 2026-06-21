import { supabase } from '../lib/supabase';
import {
  fetchTodayRecommendations,
  userRecommendationToTrack,
} from './recommendations';
import type { Track, TodayTrack, CarouselData } from '../types';
import { SERVICE_START_DATE, TRACK_CACHE_KEY } from '../constants';

export type { Track, TodayTrack, CarouselData };
export { TRACK_CACHE_KEY as CACHE_KEY };

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysSinceStart(today: string): number {
  const start = new Date(SERVICE_START_DATE);
  const current = new Date(today);
  return Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getCached(): TodayTrack | null {
  try {
    const raw = sessionStorage.getItem(TRACK_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as TodayTrack;
    if (cached.date === getTodayDateString()) return cached;
    sessionStorage.removeItem(TRACK_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

let inFlightRequest: Promise<TodayTrack | null> | null = null;

/**
 * 오늘의 추천곡을 자동으로 가져온다.
 * START_DATE부터 오늘까지의 일수를 계산해서 tracks 테이블에서 해당 순번의 곡을 선택.
 * 전체 곡 수를 넘으면 처음부터 다시 순환한다.
 * sessionStorage 캐시를 사용해 같은 날에는 Supabase를 1번만 호출한다.
 */
export async function fetchTodayTrack(): Promise<TodayTrack | null> {
  const cached = getCached();
  if (cached) return cached;

  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = fetchFromSupabase();
  try {
    return await inFlightRequest;
  } finally {
    inFlightRequest = null;
  }
}

async function fetchFromSupabase(): Promise<TodayTrack | null> {
  const today = getTodayDateString();
  const dayOffset = daysSinceStart(today);

  if (dayOffset < 0) {
    return null;
  }

  // 전체 active 트랙을 한 번에 조회 (tracks 테이블은 소량)
  const { data: allRows, error: fetchError } = await supabase
    .from('tracks')
    .select(`
      id,
      title,
      artist_name,
      album_name,
      album_image_url,
      recommendation_comment,
      apple_music_url,
      melon_url,
      youtube_music_url,
      spotify_url,
      youtube_link
    `)
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (fetchError || !allRows || allRows.length === 0) {
    return null;
  }

  const index = dayOffset % allRows.length;
  const track = allRows[index];

  if (!track) {
    return null;
  }

  const t = track as Record<string, unknown>;

  const result: TodayTrack = {
    date: today,
    track: {
      id: String(t.id),
      title: t.title as string,
      artistName: t.artist_name as string,
      albumName: (t.album_name as string) ?? '',
      albumImageUrl: (t.album_image_url as string) ?? '',
      recommendationComment: t.recommendation_comment as string | undefined,
      appleMusicUrl: t.apple_music_url as string | undefined,
      melonUrl: t.melon_url as string | undefined,
      youtubeMusicUrl: t.youtube_music_url as string | undefined,
      spotifyUrl: t.spotify_url as string | undefined,
      youtubeLink: t.youtube_link as string | undefined,
    },
  };

  try {
    sessionStorage.setItem(TRACK_CACHE_KEY, JSON.stringify(result));
  } catch { /* storage full — 무시 */ }

  return result;
}

/**
 * 캐러셀용 트랙 목록을 가져온다.
 * 큐레이션 곡(첫 번째) + 유저 추천곡(최신순)을 합쳐서 반환.
 */
export async function fetchCarouselTracks(): Promise<CarouselData> {
  const [todayTrack, recommendations] = await Promise.all([
    fetchTodayTrack(),
    fetchTodayRecommendations(),
  ]);

  // 오래된순으로 정렬 (recommendations는 created_at ASC로 이미 정렬됨)
  const userTracks = recommendations.map(userRecommendationToTrack);

  // 왼쪽(이전) → 오른쪽(최신) 순서: 큐레이션 → 오래된 유저추천 → 최신 유저추천
  const allTracks: Track[] = [];
  if (todayTrack) {
    allTracks.push(todayTrack.track);
  }
  allTracks.push(...userTracks);

  // 모든 트랙을 캐러셀에 표시 (큐레이션 → 오래된순 유저추천)
  const carouselTracks = allTracks;

  return {
    carouselTracks,
    allTracks,
    // 기본 포커스: 가장 오른쪽(최신)
    defaultIndex: carouselTracks.length - 1,
  };
}

/** 트랙 캐시를 무효화한다 (새로고침 시 호출) */
export function invalidateTrackCache(): void {
  try {
    sessionStorage.removeItem(TRACK_CACHE_KEY);
  } catch { /* ignore */ }
}
