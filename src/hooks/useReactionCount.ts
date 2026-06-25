import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n < 1000000) return `${Math.floor(n / 1000)}k`;
  return `${(n / 1000000).toFixed(1)}m`;
}

export function useReactionCount(trackId: string | undefined) {
  const [count, setCount] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const trackIdRef = useRef(trackId);

  useEffect(() => {
    trackIdRef.current = trackId;
  }, [trackId]);

  // trackId 변경 시 카운트 조회
  useEffect(() => {
    const updateId = window.setTimeout(() => {
      if (!trackId) {
        setCount(0);
        setHasReacted(false);
        return;
      }

      // localStorage에서 이미 리액션했는지 확인
      const reactedKey = `reacted:${trackId}`;
      setHasReacted(localStorage.getItem(reactedKey) === '1');
    }, 0);

    if (!trackId) {
      return () => window.clearTimeout(updateId);
    }

    // DB에서 카운트 조회
    supabase
      .rpc('get_reaction_count', { p_track_id: trackId })
      .then(({ data, error }) => {
        // trackId가 바뀌었으면 무시
        if (trackIdRef.current !== trackId) return;
        if (!error && typeof data === 'number') {
          setCount(data);
        }
      });

    return () => window.clearTimeout(updateId);
  }, [trackId]);

  // 리액션 기록 (로컬 낙관적 업데이트)
  const recordReaction = useCallback(() => {
    const tid = trackIdRef.current;
    if (!tid) return;
    const reactedKey = `reacted:${tid}`;
    if (localStorage.getItem(reactedKey) === '1') return;

    localStorage.setItem(reactedKey, '1');
    setHasReacted(true);
    setCount((prev) => prev + 1);
  }, []);

  return { count, formattedCount: formatCount(count), hasReacted, recordReaction };
}
