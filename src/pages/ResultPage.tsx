import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, useToast } from '@toss/tds-mobile';
import { isMusicUrl, readClipboardSilent } from '../lib/musicUrl';
import { useReactions } from '../lib/reactions/useReactions';
import { useCarouselTracks } from '../hooks/useCarouselTracks';
import { useReactionCount } from '../hooks/useReactionCount';
import { useBackgroundCrossfade } from '../hooks/useBackgroundCrossfade';
import { AlbumCarousel } from '../components/AlbumCarousel';
import { OverflowTrackSheet } from '../components/OverflowTrackSheet';
import { ReactionBar } from '../components/ReactionBar';
import { ResultLoadingState } from '../components/ResultLoadingState';
import { ResultErrorState } from '../components/ResultErrorState';
import { ResultEmptyState } from '../components/ResultEmptyState';
import { BackgroundCrossfade } from '../components/BackgroundCrossfade';
import { TrackInfo } from '../components/TrackInfo';
import { ListenBottomSheet } from '../components/ListenBottomSheet';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator';



export function ResultPage({ onClickRecommend, onGoHome, skipClipboardToast }: { onClickRecommend?: (prefillUrl?: string) => void; onGoHome?: () => void; skipClipboardToast?: boolean }) {
  const toast = useToast();
  const toastRef = useRef(toast);
  const lastClipboardTextRef = useRef<string>('');
  const skipInitialToastRef = useRef(!!skipClipboardToast);
  const {
    carouselTracks,
    allTracks,
    activeIndex,
    setActiveIndex,
    setCarouselTracks,
    loading,
    error,
    retry,
    refresh,
    initialBgImage,
  } = useCarouselTracks();

  const [listenSheetOpen, setListenSheetOpen] = useState(false);
  const [overflowSheetOpen, setOverflowSheetOpen] = useState(false);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const { pullDistance, refreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: refresh,
  });

  const currentTrack = carouselTracks[activeIndex] ?? carouselTracks[0];
  const trackId = currentTrack?.id;

  const { formattedCount, recordReaction } = useReactionCount(trackId);
  const { activeReactions, handleEmojiClick } = useReactions({
    trackId,
    onReactionSent: recordReaction,
    onReactionLimitReached: () => {
      toastRef.current.openToast('반응은 노래당 1개만 남길 수 있어요.', { type: 'top' });
    },
  });

  const {
    prevBgImage,
    bgTransitioning,
    handleActiveIndexChange,
    setPrevBgImage,
  } = useBackgroundCrossfade(carouselTracks, activeIndex, initialBgImage);

  const onActiveIndexChange = (index: number) => {
    handleActiveIndexChange(index, setActiveIndex);
  };

  // 콜백을 ref로 보관 (useEffect 의존성에서 제외)
  const onClickRecommendRef = useRef(onClickRecommend);

  useEffect(() => {
    onClickRecommendRef.current = onClickRecommend;
  }, [onClickRecommend]);

  // 퍼널에 진입한 링크를 sessionStorage에 저장하여 중복 토스트 방지
  const DISMISSED_KEY = 'tds-toast-dismissed-url';

  // 클립보드에 음악 링크가 있으면 추천 토스트 표시
  const checkClipboard = useCallback(() => {
    readClipboardSilent().then((text) => {
      const trimmed = text.trim();
      if (!trimmed || !isMusicUrl(trimmed)) return;
      // 같은 링크면 중복 토스트 방지
      if (trimmed === lastClipboardTextRef.current) return;
      // 이미 퍼널로 진입한 링크면 토스트 표시하지 않음
      try {
        if (sessionStorage.getItem(DISMISSED_KEY) === trimmed) return;
      } catch { /* ignore */ }

      lastClipboardTextRef.current = trimmed;

      toastRef.current.openToast('방금 복사한 음악으로 추천할까요?', {
        type: 'bottom',
        button: {
          text: '추천하기',
          onClick: () => {
            // 퍼널로 진입한 링크 기록 → 돌아와도 토스트 안 뜸
            try { sessionStorage.setItem(DISMISSED_KEY, trimmed); } catch { /* ignore */ }
            onClickRecommendRef.current?.(trimmed);
          },
        },
        higherThanCTA: true,
      });
    }).catch(() => {
      // 클립보드 읽기 권한 없음 — 무시
    });
  }, []);

  // 최초 로딩 완료 시 클립보드 확인 (추천 퍼널에서 돌아온 직후에는 skip)
  useEffect(() => {
    if (loading || error) return;
    if (skipInitialToastRef.current) {
      skipInitialToastRef.current = false;
      return;
    }
    checkClipboard();
  }, [loading, error, checkClipboard]);

  // 백그라운드에서 복귀 시 클립보드 다시 확인 (항상)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkClipboard();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkClipboard]);

  if (loading) {
    return <ResultLoadingState />;
  }

  if (error) {
    return <ResultErrorState onRetry={retry} onGoHome={onGoHome} />;
  }

  if (carouselTracks.length === 0) {
    return <ResultEmptyState />;
  }

  const track = currentTrack;
  if (!track) return null;
  const isUserRecommendation = !!track.originalUrl;

  return (
    <div
      {...pullHandlers}
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'unset',
      }}
    >
      <BackgroundCrossfade
        prevImage={prevBgImage}
        currentImage={track.albumImageUrl}
        transitioning={bgTransitioning}
      />

      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />

      {/* 콘텐츠 */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 && !refreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {/* 전체 플레이리스트 버튼 */}
        <div style={{ paddingInline: 16, marginTop: 40, display: 'flex', justifyContent: 'center' }}>
          <Button size="small" color="light" variant="weak" onClick={() => setOverflowSheetOpen(true)}>
            전체 플레이리스트 보기
          </Button>
        </div>

        {/* 앨범 아트 캐러셀 */}
        <AlbumCarousel
          tracks={carouselTracks}
          activeIndex={activeIndex}
          onActiveIndexChange={onActiveIndexChange}
          onOverflowSwipe={() => setOverflowSheetOpen(true)}
        />

        {/* 곡 정보 */}
        <TrackInfo track={track} isUserRecommendation={isUserRecommendation} />

        {/* 하단 버튼 영역 */}
        <div style={{ flex: 1, marginTop: 40 }} />
        <ReactionBar activeReactions={activeReactions} onEmojiClick={handleEmojiClick} formattedCount={formattedCount}>
          <div
            style={{
              width: '100%',
              height: 'fit-content',
              backdropFilter: 'blur(0px)',
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              justifyContent: 'flex-start',
              alignItems: 'center',
              paddingLeft: 16,
              paddingRight: 16,
            }}
          >
            <Button size="large" color="dark" display="block" onClick={() => onClickRecommend?.()}>
              내 음악 추천하기
            </Button>
            <Button
              size="large"
              display="block"
              onClick={() => setListenSheetOpen(true)}
            >
              음악 들으러 가기
            </Button>
          </div>
        </ReactionBar>
      </div>

      <ListenBottomSheet
        open={listenSheetOpen}
        onClose={() => setListenSheetOpen(false)}
        track={track}
        isUserRecommendation={isUserRecommendation}
        openToast={toast.openToast}
      />

      <OverflowTrackSheet
        open={overflowSheetOpen}
        onClose={() => setOverflowSheetOpen(false)}
        tracks={allTracks}
        onSelectTrack={(index) => {
          // 전체 트랙으로 확장하고 선택된 위치로 이동 (원래 순서 유지)
          setCarouselTracks(allTracks);
          onActiveIndexChange(index);
          setPrevBgImage(allTracks[index].albumImageUrl);
        }}
      />
    </div>
  );
}
