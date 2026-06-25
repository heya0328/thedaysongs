import { useEffect, useState, useCallback, useRef } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

const LIVE_FULLSCREEN_AD_GROUP_ID = 'ait.v2.live.8abe96d26b2d45f2';
const TEST_FULLSCREEN_AD_GROUP_ID = 'ait-ad-test-interstitial-id';
const LOAD_WAIT_MS = 3000;
const LOAD_POLL_MS = 100;

const useTestAds =
  import.meta.env.DEV || import.meta.env.VITE_USE_TEST_ADS === 'true';

const FULLSCREEN_AD_GROUP_ID = useTestAds
  ? TEST_FULLSCREEN_AD_GROUP_ID
  : (import.meta.env.VITE_FULLSCREEN_AD_GROUP_ID?.trim() || LIVE_FULLSCREEN_AD_GROUP_ID);

function isSupported(method: { isSupported: () => boolean }) {
  try {
    return method.isSupported();
  } catch {
    return false;
  }
}

export function useFullScreenAd() {
  const [loaded, setLoaded] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const onDismissRef = useRef<(() => void) | null>(null);
  const loadedRef = useRef(false);
  const loadingRef = useRef(false);
  const loadUnregisterRef = useRef<(() => void) | null>(null);
  const showUnregisterRef = useRef<(() => void) | null>(null);
  const waitTimerRef = useRef<{
    timeoutId: number;
    pollId: number;
  } | null>(null);

  const clearWaitTimer = useCallback(() => {
    if (waitTimerRef.current == null) return;

    window.clearTimeout(waitTimerRef.current.timeoutId);
    window.clearInterval(waitTimerRef.current.pollId);
    waitTimerRef.current = null;
  }, []);

  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);

  const requestLoad = useCallback(() => {
    if (!isSupported(loadFullScreenAd)) {
      loadingRef.current = false;
      loadedRef.current = false;
      setLoaded(false);
      return false;
    }

    if (loadedRef.current || loadingRef.current) {
      return true;
    }

    loadingRef.current = true;
    loadedRef.current = false;
    setLoaded(false);
    loadUnregisterRef.current?.();

    try {
      loadUnregisterRef.current = loadFullScreenAd({
        options: { adGroupId: FULLSCREEN_AD_GROUP_ID },
        onEvent: (event) => {
          if (event.type !== 'loaded') return;

          loadingRef.current = false;
          loadedRef.current = true;
          setLoaded(true);
        },
        onError: (error) => {
          console.error('[ad] load failed:', error);
          loadingRef.current = false;
          loadedRef.current = false;
          setLoaded(false);
        },
      });
      return true;
    } catch (error) {
      console.error('[ad] load failed:', error);
      loadingRef.current = false;
      loadedRef.current = false;
      setLoaded(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      requestLoad();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
      clearWaitTimer();
      loadUnregisterRef.current?.();
      showUnregisterRef.current?.();
      loadUnregisterRef.current = null;
      showUnregisterRef.current = null;
    };
  }, [clearWaitTimer, requestLoad]);

  const finishShow = useCallback(() => {
    const onDismiss = onDismissRef.current;

    onDismissRef.current = null;
    showUnregisterRef.current?.();
    showUnregisterRef.current = null;
    setWaiting(false);
    requestLoad();
    onDismiss?.();
  }, [requestLoad]);

  const showLoadedAd = useCallback((onDismiss: () => void) => {
    clearWaitTimer();

    if (!isSupported(showFullScreenAd)) {
      onDismiss();
      return;
    }

    onDismissRef.current = onDismiss;
    loadedRef.current = false;
    setLoaded(false);
    showUnregisterRef.current?.();

    try {
      showUnregisterRef.current = showFullScreenAd({
        options: { adGroupId: FULLSCREEN_AD_GROUP_ID },
        onEvent: (event) => {
          if (event.type === 'dismissed' || event.type === 'failedToShow') {
            finishShow();
          }
        },
        onError: (error) => {
          console.error('[ad] show failed:', error);
          finishShow();
        },
      });
    } catch (error) {
      console.error('[ad] show failed:', error);
      finishShow();
    }
  }, [clearWaitTimer, finishShow]);

  const show = useCallback((onDismiss: () => void) => {
    if (loadedRef.current) {
      showLoadedAd(onDismiss);
      return;
    }

    if (!isSupported(loadFullScreenAd) || !isSupported(showFullScreenAd)) {
      onDismiss();
      return;
    }

    requestLoad();
    clearWaitTimer();
    setWaiting(true);

    const timeoutId = window.setTimeout(() => {
      clearWaitTimer();
      setWaiting(false);
      onDismiss();
    }, LOAD_WAIT_MS);

    const pollId = window.setInterval(() => {
      if (loadedRef.current) {
        clearWaitTimer();
        showLoadedAd(onDismiss);
      }
    }, LOAD_POLL_MS);

    waitTimerRef.current = { timeoutId, pollId };
  }, [clearWaitTimer, requestLoad, showLoadedAd]);

  return { loaded, waiting, show };
}
