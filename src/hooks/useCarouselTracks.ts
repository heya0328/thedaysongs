import { useCallback, useEffect, useState } from 'react';
import { fetchCarouselTracks, invalidateTrackCache } from '../data/tracks';
import { invalidateRecsCache } from '../data/recommendations';
import type { Track } from '../types';

const ACTIVE_TRACK_KEY = 'tds-active-track-id';

function saveActiveTrackId(id: string) {
  try { sessionStorage.setItem(ACTIVE_TRACK_KEY, id); } catch { /* ignore */ }
}

function loadActiveTrackId(): string | null {
  try { return sessionStorage.getItem(ACTIVE_TRACK_KEY); } catch { return null; }
}

export function useCarouselTracks() {
  const [carouselTracks, setCarouselTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [initialBgImage, setInitialBgImage] = useState('');

  const retry = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchCarouselTracks();
      setCarouselTracks(data.carouselTracks);
      setAllTracks(data.allTracks);

      // 이전에 보고 있던 트랙 복원
      const savedId = loadActiveTrackId();
      let restoredIndex = data.defaultIndex;
      if (savedId) {
        const found = data.carouselTracks.findIndex((t) => t.id === savedId);
        if (found >= 0) restoredIndex = found;
      }

      setActiveIndex(restoredIndex);
      if (data.carouselTracks.length > 0) {
        setInitialBgImage(data.carouselTracks[restoredIndex].albumImageUrl);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 당겨서 새로고침: 캐시 무효화 + 데이터 재조회 */
  const refresh = useCallback(async () => {
    invalidateTrackCache();
    invalidateRecsCache();
    try {
      const data = await fetchCarouselTracks();
      setCarouselTracks(data.carouselTracks);
      setAllTracks(data.allTracks);

      // 현재 보고 있던 트랙 위치 유지 시도
      const savedId = loadActiveTrackId();
      let restoredIndex = data.defaultIndex;
      if (savedId) {
        const found = data.carouselTracks.findIndex((t) => t.id === savedId);
        if (found >= 0) restoredIndex = found;
      }
      setActiveIndex(restoredIndex);
      if (data.carouselTracks.length > 0) {
        setInitialBgImage(data.carouselTracks[restoredIndex].albumImageUrl);
      }
    } catch {
      // 새로고침 실패 시 기존 데이터 유지
    }
  }, []);

  useEffect(() => {
    retry();
  }, [retry]);

  // activeIndex 변경 시 현재 트랙 ID 저장
  const setActiveIndexWithSave = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // carouselTracks나 activeIndex 변경 시 저장
  useEffect(() => {
    const track = carouselTracks[activeIndex];
    if (track) saveActiveTrackId(track.id);
  }, [carouselTracks, activeIndex]);

  return {
    carouselTracks,
    allTracks,
    activeIndex,
    setActiveIndex: setActiveIndexWithSave,
    setCarouselTracks,
    loading,
    error,
    retry,
    refresh,
    initialBgImage,
  };
}
