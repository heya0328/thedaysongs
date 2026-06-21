import { useCallback, useRef, useState } from 'react';

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
}

export function usePullToRefresh({ onRefresh }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    // 스크롤이 최상단일 때만 pull 시작
    if (window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullingRef.current || refreshing) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY <= 0) {
      setPullDistance(0);
      return;
    }
    // 저항감 적용 (드래그할수록 느려짐)
    const dampened = Math.min(deltaY * 0.4, MAX_PULL);
    setPullDistance(dampened);
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pullingRef.current || refreshing) return;
    pullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  return {
    pullDistance,
    refreshing,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
