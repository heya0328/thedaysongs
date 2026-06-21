import { useCallback, useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';
import type { TossAdsAttachBannerOptions } from '@apps-in-toss/web-framework';

// TODO: 실제 광고 그룹 ID로 교체
const BANNER_AD_GROUP_ID = 'ait.v2.live.0b21287b0c144a92';

let initialized = false;
let initializing = false;
const onInitCallbacks: Array<() => void> = [];

function ensureInitialized(cb: () => void) {
  if (initialized) {
    cb();
    return;
  }
  onInitCallbacks.push(cb);
  if (initializing) return;
  initializing = true;

  try {
    if (!TossAds.initialize.isSupported()) return;
  } catch {
    return;
  }

  TossAds.initialize({
    callbacks: {
      onInitialized: () => {
        initialized = true;
        onInitCallbacks.forEach((fn) => fn());
        onInitCallbacks.length = 0;
      },
      onInitializationFailed: (error) => {
        console.error('[banner-ad] init failed:', error);
        initializing = false;
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
