import { useCallback, useEffect, useRef, useState } from 'react';
import type { Track } from '../types';
import {
  CAROUSEL_CARD_SIZE,
  SWIPE_THRESHOLD,
  VELOCITY_THRESHOLD,
  RUBBER_BAND_FACTOR,
} from '../constants';
import { FlippableAlbumCard } from './FlippableAlbumCard';

const CARD_SIZE = CAROUSEL_CARD_SIZE;

/**
 * 각 카드의 스타일을 계산.
 * distance < 0: 왼쪽(이전), distance > 0: 오른쪽(다음/최신)
 * 드래그 시 이전/다음 카드가 자연스럽게 따라오는 효과.
 */
function getCardStyle(distance: number, dragDelta: number, isDragging: boolean) {
  const absDistance = Math.abs(distance);

  if (absDistance > 2) {
    return { opacity: 0, scale: 0.7, translateX: 0, zIndex: 0 };
  }

  // 중앙 카드: 드래그에 따라 이동
  if (distance === 0) {
    return {
      opacity: 1,
      scale: 1,
      translateX: dragDelta,
      zIndex: 10,
    };
  }

  const direction = distance > 0 ? 1 : -1; // +1: 오른쪽, -1: 왼쪽
  const tier = absDistance;
  const stackOffsetX = direction * tier * 24;
  const stackScale = 1 - tier * 0.08;
  const stackOpacity = 1 - tier * 0.3;

  // 드래그 중 인터랙티브: 드래그 방향 쪽 카드가 중앙으로 다가옴
  let interactiveDeltaX = 0;
  if (isDragging) {
    // 왼쪽으로 드래그(delta<0) → 오른쪽 카드(distance>0) 반응
    // 오른쪽으로 드래그(delta>0) → 왼쪽 카드(distance<0) 반응
    if ((dragDelta < 0 && distance > 0) || (dragDelta > 0 && distance < 0)) {
      const progress = Math.min(Math.abs(dragDelta) / CARD_SIZE, 1);
      interactiveDeltaX = -direction * progress * 12;
    }
  }

  return {
    opacity: stackOpacity,
    scale: stackScale,
    translateX: stackOffsetX + interactiveDeltaX,
    zIndex: 10 - absDistance,
  };
}

interface AlbumCarouselProps {
  tracks: Track[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onOverflowSwipe: () => void;
}

export function AlbumCarousel({
  tracks,
  activeIndex,
  onActiveIndexChange,
  onOverflowSwipe,
}: AlbumCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [flipState, setFlipState] = useState({ index: activeIndex, flipped: false });
  const dragDeltaRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragState = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
  });
  const activeIndexRef = useRef(activeIndex);

  const isHorizontalRef = useRef<boolean | null>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // 이미지 프리로드
  useEffect(() => {
    tracks.forEach((t) => {
      if (t.albumImageUrl) {
        const img = new Image();
        img.src = t.albumImageUrl;
      }
    });
  }, [tracks]);

  // touchAction: none 이므로 세로 드래그 시 수동 스크롤 처리
  const lastTouchYRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      lastTouchYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      // 방향 미정 또는 수평 드래그 → 브라우저 스크롤 완전 차단
      if (isHorizontalRef.current !== false) {
        e.preventDefault();
        return;
      }
      // 수직 드래그 확정 → 수동으로 스크롤 수행
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchYRef.current - currentY;
      lastTouchYRef.current = currentY;
      window.scrollBy(0, deltaY);
      e.preventDefault();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (tracks.length === 0) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
    };
    isHorizontalRef.current = null; // 방향 미정
    isDraggingRef.current = true;
    dragDeltaRef.current = 0;
    setIsDragging(true);
    setIsGrabbing(true);
    setDragDelta(0);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch { /* ignore */ }
  }, [tracks.length]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;

      // 방향 판단 (한 번만)
      if (isHorizontalRef.current === null) {
        const dx = Math.abs(e.clientX - dragState.current.startX);
        const dy = Math.abs(e.clientY - dragState.current.startY);
        if (dx > 8 || dy > 8) {
          isHorizontalRef.current = dx > dy;
          if (!isHorizontalRef.current) {
            // 수직 드래그 → 캐러셀 드래그 취소, 페이지 스크롤 허용
            isDraggingRef.current = false;
            setIsDragging(false);
            setIsGrabbing(false);
            return;
          }
        } else {
          return; // 아직 판단 안 됨
        }
      }

      let delta = e.clientX - dragState.current.startX;
      const idx = activeIndexRef.current;

      // 러버밴드
      if ((idx === 0 && delta > 0) || (idx >= tracks.length - 1 && delta < 0)) {
        delta *= RUBBER_BAND_FACTOR;
      }

      dragDeltaRef.current = delta;
      setDragDelta(delta);
    },
    [tracks.length],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // 포인터가 이미 해제된 경우 무시
      }

      const delta = dragDeltaRef.current;
      const elapsed = Date.now() - dragState.current.startTime;
      const velocity = elapsed > 0 ? Math.abs(delta) / elapsed : 0;
      const idx = activeIndexRef.current;

      let nextIndex = idx;
      let shouldOverflow = false;

      // 탭(클릭) 감지: 거의 움직이지 않은 경우 → 카드 flip
      if (Math.abs(delta) < 5 && elapsed < 300) {
        isDraggingRef.current = false;
        dragDeltaRef.current = 0;
        isHorizontalRef.current = null;
        setIsDragging(false);
        setIsGrabbing(false);
        setDragDelta(0);
        setFlipState((current) => ({
          index: idx,
          flipped: current.index === idx ? !current.flipped : true,
        }));
        return;
      }

      if (Math.abs(delta) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
        if (delta < 0) {
          // 왼쪽 스와이프 → 오른쪽으로 이동 (더 최신 곡)
          if (idx >= tracks.length - 1) {
            shouldOverflow = true;
          } else {
            nextIndex = idx + 1;
          }
        } else {
          // 오른쪽 스와이프 → 왼쪽으로 이동 (더 이전 곡)
          if (idx <= 0) {
            shouldOverflow = true;
          } else {
            nextIndex = idx - 1;
          }
        }
      }

      // 상태 초기화를 먼저 수행
      isDraggingRef.current = false;
      dragDeltaRef.current = 0;
      isHorizontalRef.current = null;
      setIsDragging(false);
      setIsGrabbing(false);
      setDragDelta(0);

      if (nextIndex !== idx) {
        onActiveIndexChange(nextIndex);
      }

      // overflow는 상태 초기화 후 다음 프레임에서 호출
      if (shouldOverflow) {
        requestAnimationFrame(() => {
          onOverflowSwipe();
        });
      }
    },
    [tracks.length, onActiveIndexChange, onOverflowSwipe],
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        paddingTop: 20,
        paddingBottom: 40,
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 카드 스택 컨테이너 */}
      <div
        style={{
          position: 'relative',
          width: CARD_SIZE,
          height: CARD_SIZE,
          margin: '0 auto',
        }}
      >
        {/* 장식용 스택 카드: 이전/다음 카드가 없는 쪽에도 어포던스 제공 */}
        {(() => {
          const decorSlots: number[] = [];
          const hasPrev = activeIndex > 0;
          const hasNext = activeIndex < tracks.length - 1;
          // 왼쪽에 실제 카드가 없으면 장식 카드 추가
          if (!hasPrev) { decorSlots.push(-1); decorSlots.push(-2); }
          else if (activeIndex === 1) { decorSlots.push(-2); }
          // 오른쪽에 실제 카드가 없으면 장식 카드 추가
          if (!hasNext) { decorSlots.push(1); decorSlots.push(2); }
          else if (activeIndex === tracks.length - 2) { decorSlots.push(2); }

          return decorSlots.map((slot) => {
            const currentTrack = tracks[activeIndex];
            const decorStyle = getCardStyle(slot, isDragging ? dragDelta : 0, isDragging);
            return (
              <div
                key={`decor-${slot}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: CARD_SIZE,
                  height: CARD_SIZE,
                  borderRadius: 12,
                  overflow: 'hidden',
                  opacity: decorStyle.opacity * 0.5,
                  transform: `translateX(${decorStyle.translateX}px) scale(${decorStyle.scale})`,
                  transition: isDragging
                    ? 'none'
                    : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease',
                  zIndex: decorStyle.zIndex,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <img
                  src={currentTrack?.albumImageUrl || '/logo_300.png'}
                  alt=""
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    filter: 'brightness(0.7)',
                  }}
                />
              </div>
            );
          });
        })()}

        {/* 실제 트랙 카드 */}
        {tracks.map((track, i) => {
          const distance = i - activeIndex;
          const style = getCardStyle(distance, isDragging ? dragDelta : 0, isDragging);
          // grab 피드백: 활성 카드가 잡히면 살짝 커짐
          const isActive = distance === 0;
          const flipped = flipState.index === activeIndex && flipState.flipped;
          const grabbing = isActive && isGrabbing;
          const grabScale = grabbing ? 1.04 : 1;
          const finalScale = style.scale * grabScale;
          return (
            <div
              key={track.id}
              style={{
                position: isActive ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                width: CARD_SIZE,
                height: CARD_SIZE,
                opacity: style.opacity,
                transform: `translateX(${style.translateX}px) scale(${finalScale})`,
                transition: isDragging
                  ? 'none'
                  : 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                zIndex: style.zIndex,
                willChange: 'transform, opacity',
              }}
            >
              <FlippableAlbumCard
                track={track}
                flipped={isActive && flipped}
                cardSize={CARD_SIZE}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
