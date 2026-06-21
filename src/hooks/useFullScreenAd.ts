import { useEffect, useState, useCallback, useRef } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

const AD_GROUP_ID = 'ait.v2.live.8abe96d26b2d45f2';

export function useFullScreenAd() {
  const [loaded, setLoaded] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const onDismissRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try { if (!loadFullScreenAd.isSupported()) return; } catch { return; }

    const unregister = loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setLoaded(true);
        }
      },
      onError: (error) => {
        console.error('[ad] load failed:', error);
      },
    });

    return () => unregister();
  }, []);

  const reload = useCallback(() => {
    setLoaded(false);
    try { if (!loadFullScreenAd.isSupported()) return; } catch { return; }

    loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') setLoaded(true);
      },
      onError: (error) => {
        console.error('[ad] reload failed:', error);
      },
    });
  }, []);

  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;

  const showAd = useCallback((onDismiss: () => void) => {
    let supported = false;
    try { supported = showFullScreenAd.isSupported(); } catch { /* non-toss env */ }
    if (!supported) {
      onDismiss();
      return;
    }

    onDismissRef.current = onDismiss;

    showFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'dismissed' || event.type === 'failedToShow') {
          const cb = onDismissRef.current;
          onDismissRef.current = null;
          reload();
          cb?.();
        }
      },
      onError: () => {
        const cb = onDismissRef.current;
        onDismissRef.current = null;
        reload();
        cb?.();
      },
    });
  }, [reload]);

  const show = useCallback((onDismiss: () => void) => {
    // 이미 로드됐으면 바로 표시
    if (loadedRef.current) {
      showAd(onDismiss);
      return;
    }
    // 아직 로딩 중이면 최대 3초 대기 + waiting 상태 표시
    setWaiting(true);
    const done = (cb: () => void) => {
      setWaiting(false);
      cb();
    };
    const timeout = setTimeout(() => {
      clearInterval(poll);
      done(onDismiss);
    }, 3000);
    const poll = setInterval(() => {
      if (loadedRef.current) {
        clearTimeout(timeout);
        clearInterval(poll);
        done(() => showAd(onDismiss));
      }
    }, 100);
  }, [showAd]);

  return { loaded, waiting, show };
}
