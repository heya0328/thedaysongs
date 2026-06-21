import { useCallback, useEffect, useState } from 'react';
import { appLogin, Storage } from '@apps-in-toss/web-framework';

const LOGIN_KEY = 'tds-toss-logged-in';

/**
 * SDK Storage에서 로그인 상태를 읽는다.
 * SDK 미지원 환경에서는 localStorage fallback.
 */
async function getLoginState(): Promise<boolean> {
  try {
    const value = await Storage.getItem(LOGIN_KEY);
    if (value === 'true') return true;
  } catch {
    // SDK Storage 미지원 → localStorage fallback
    try {
      return localStorage.getItem(LOGIN_KEY) === 'true';
    } catch { /* ignore */ }
  }
  return false;
}

/** 로그인 상태를 영구 저장한다. */
async function saveLoginState(): Promise<void> {
  try {
    await Storage.setItem(LOGIN_KEY, 'true');
  } catch {
    try {
      localStorage.setItem(LOGIN_KEY, 'true');
    } catch { /* ignore */ }
  }
}

export function useTossLogin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  // 마운트 시 저장된 로그인 상태 복원
  useEffect(() => {
    getLoginState().then((state) => {
      setLoggedIn(state);
      setChecking(false);
    });
  }, []);

  /**
   * 로그인을 시도한다.
   * - 이미 로그인 되어있으면 즉시 true 반환.
   * - appLogin() 성공 시 상태 저장 후 true 반환.
   * - 실패/취소 시 false 반환.
   */
  const login = useCallback(async (): Promise<boolean> => {
    if (loggedIn) return true;

    try {
      await appLogin();
      await saveLoginState();
      setLoggedIn(true);
      return true;
    } catch {
      // 사용자 취소 또는 비토스 환경 에러 — 무시
      return false;
    }
  }, [loggedIn]);

  return { loggedIn, checking, login };
}
