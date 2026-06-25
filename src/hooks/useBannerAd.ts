import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import type { TossAdsAttachBannerOptions } from '@apps-in-toss/web-framework';

const LIVE_BANNER_AD_GROUP_ID = 'ait.v2.live.0b21287b0c144a92';
const TEST_BANNER_AD_GROUP_ID = 'ait-ad-test-banner-id';

const useTestAds =
  import.meta.env.DEV || import.meta.env.VITE_USE_TEST_ADS === 'true';

const BANNER_AD_GROUP_ID = useTestAds
  ? TEST_BANNER_AD_GROUP_ID
  : (import.meta.env.VITE_BANNER_AD_GROUP_ID?.trim() || LIVE_BANNER_AD_GROUP_ID);

let initialized = false;
let initializing = false;
const onInitCallbacks: Array<() => void> = [];

function flushInitCallbacks() {
  onInitCallbacks.forEach((fn) => fn());
  onInitCallbacks.length = 0;
}

function resetPendingInitCallbacks() {
  onInitCallbacks.length = 0;
}

function ensureInitialized(cb: () => void) {
  if (initialized) {
    cb();
    return;
  }
  onInitCallbacks.push(cb);
  if (initializing) return;
  initializing = true;

  try {
    if (!TossAds.initialize.isSupported()) {
      initializing = false;
      resetPendingInitCallbacks();
      return;
    }
  } catch {
    initializing = false;
    resetPendingInitCallbacks();
    return;
  }

  TossAds.initialize({
    callbacks: {
      onInitialized: () => {
        initialized = true;
        initializing = false;
        flushInitCallbacks();
      },
      onInitializationFailed: (error) => {
        console.error('[banner-ad] init failed:', error);
        initializing = false;
        resetPendingInitCallbacks();
      },
    },
  });
}

/**
 * 배너 광고를 특정 DOM 요소에 부착하는 hook.
 * 반환된 ref를 배너 컨테이너 div에 연결하면 자동으로 광고가 부착/해제된다.
 */
export function useBannerAd(options?: Omit<TossAdsAttachBannerOptions, 'callbacks'>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adReady, setAdReady] = useState(initialized);

  useEffect(() => {
    ensureInitialized(() => setAdReady(true));
  }, []);

  useEffect(() => {
    if (!adReady || !containerRef.current) return;

    let destroyed = false;
    let result: { destroy: () => void } | undefined;

    try {
      result = TossAds.attachBanner(BANNER_AD_GROUP_ID, containerRef.current, {
        theme: options?.theme ?? 'auto',
        tone: options?.tone ?? 'blackAndWhite',
        variant: options?.variant ?? 'expanded',
        callbacks: {
          onAdFailedToRender: (payload) => {
            console.warn('[banner-ad] render failed:', payload.error?.message);
          },
          onNoFill: () => {
            console.info('[banner-ad] no fill');
          },
        },
      });
    } catch (e) {
      console.warn('[banner-ad] attach failed:', e);
    }

    return () => {
      if (!destroyed) {
        destroyed = true;
        result?.destroy();
      }
    };
  }, [adReady, options?.theme, options?.tone, options?.variant]);

  return containerRef;
}
