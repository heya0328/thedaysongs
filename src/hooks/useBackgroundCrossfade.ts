import { useCallback, useState } from 'react';
import type { Track } from '../types';
import { BG_CROSSFADE_MS } from '../constants';

export function useBackgroundCrossfade(
  carouselTracks: Track[],
  activeIndex: number,
  initialBgImage: string,
) {
  const [prevBgImage, setPrevBgImage] = useState(initialBgImage);
  const [bgTransitioning, setBgTransitioning] = useState(false);

  // Sync when initialBgImage changes (after first load)
  // We use a ref-like approach: the initial state is set, and subsequent
  // updates happen only via handleActiveIndexChange.

  const handleActiveIndexChange = useCallback((index: number, setActiveIndex: (i: number) => void) => {
    setPrevBgImage(carouselTracks[activeIndex]?.albumImageUrl ?? '');
    setBgTransitioning(true);
    setActiveIndex(index);
    const timer = window.setTimeout(() => {
      setBgTransitioning(false);
      setPrevBgImage(carouselTracks[index]?.albumImageUrl ?? '');
    }, BG_CROSSFADE_MS);
    return () => clearTimeout(timer);
  }, [carouselTracks, activeIndex]);

  return {
    prevBgImage,
    bgTransitioning,
    handleActiveIndexChange,
    setPrevBgImage,
  };
}
