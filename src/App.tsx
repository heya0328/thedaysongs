import { useCallback, useEffect, useRef, useState } from 'react';
import { closeView, graniteEvent } from '@apps-in-toss/web-framework';
import { ConfirmDialog, Button } from '@toss/tds-mobile';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';
import { LinkTestPage } from './pages/LinkTestPage';
import { RecommendLinkPage } from './pages/recommend/RecommendLinkPage';
import { RecommendStoryPage } from './pages/recommend/RecommendStoryPage';
import { RecommendCompletePage } from './pages/recommend/RecommendCompletePage';
import type { RecommendData } from './pages/recommend/types';
import { submitRecommendation, invalidateRecsCache } from './data/recommendations';
import { CACHE_KEY } from './data/tracks';
import { useFullScreenAd } from './hooks/useFullScreenAd';
import { useTossLogin } from './hooks/useTossLogin';

type Page =
  | 'home'
  | 'result'
  | 'link-test'
  | 'recommend-link'
  | 'recommend-story'
  | 'recommend-complete';

const PAGE_STORAGE_KEY = 'tds-current-page';
const RESTORABLE_PAGES = new Set<Page>(['home', 'result']);

/** intoss:// 스킴 path → Page 매핑 */
const PATH_TO_PAGE: Record<string, Page> = {
  '/home': 'home',
  '/result': 'result',
  '/recommend': 'recommend-link',
};

function getInitialPage(): Page {
  // 1) 스킴 딥링크 path 확인
  const path = window.location.pathname;
  if (path && path !== '/') {
    const pathPage = PATH_TO_PAGE[path];
    if (pathPage) return pathPage;
  }

  // 2) sessionStorage 복원
  try {
    const stored = sessionStorage.getItem(PAGE_STORAGE_KEY) as Page | null;
    if (stored && RESTORABLE_PAGES.has(stored)) return stored;
  } catch { /* ignore */ }

  return 'home';
}

/**
 * 각 페이지에서 뒤로가기를 누르면 어디로 가는지 명시적으로 정의.
 * null = 종료 다이얼로그
 */
const BACK_MAP: Record<Page, Page | null> = {
  'home': null,                    // → 종료 다이얼로그
  'result': 'home',                // → 홈
  'link-test': 'home',             // → 홈
  'recommend-link': 'result',      // → 음악 상세 (보던 음악 유지)
  'recommend-story': 'recommend-link', // → 링크 입력
  'recommend-complete': 'recommend-story', // → 사연 입력
};

function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [recommendData, setRecommendData] = useState<Omit<RecommendData, 'story'> | null>(null);
  const [prefillUrl, setPrefillUrl] = useState<string | undefined>();
  const [cameFromRecommend, setCameFromRecommend] = useState(false);
  const ad = useFullScreenAd();
  const { loggedIn, login } = useTossLogin();
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const recommendDataRef = useRef(recommendData);
  recommendDataRef.current = recommendData;

  const pageRef = useRef(page);
  pageRef.current = page;

  // 페이지 변경 시 sessionStorage에 저장
  useEffect(() => {
    try {
      sessionStorage.setItem(PAGE_STORAGE_KEY, page);
    } catch { /* ignore */ }
  }, [page]);

  // 페이지 전환 (브라우저 히스토리 사용 안 함 — backEvent로 직접 제어)
  const navigate = useCallback((nextPage: Page) => {
    setPage(nextPage);
  }, []);

  // 뒤로가기 로직 — BACK_MAP 기반
  const goBack = useCallback(() => {
    const current = pageRef.current;
    const target = BACK_MAP[current];

    if (target === null) {
      // 홈 → 종료 다이얼로그
      setCloseDialogOpen(true);
      return;
    }

    // 퍼널 중간에서 뒤로갈 때 데이터 없으면 result로
    if (target === 'recommend-link' && !recommendDataRef.current) {
      setPage('result');
      return;
    }

    setPage(target);
  }, []);

  // 네이티브 뒤로가기(backEvent) — 모든 페이지에서 직접 제어
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = graniteEvent.addEventListener('backEvent', {
        onEvent: () => {
          goBack();
        },
        onError: (error) => {
          console.error('[backEvent] error:', error);
        },
      });
    } catch { /* non-toss env */ }

    return () => { unsubscribe?.(); };
  }, [goBack]);

  if (page === 'link-test') {
    return <LinkTestPage onBack={() => navigate('home')} />;
  }

  if (page === 'recommend-link') {
    return (
      <RecommendLinkPage
        onBack={() => navigate('result')}
        initialUrl={prefillUrl}
        onNext={(data) => {
          setPrefillUrl(undefined);
          setRecommendData(data);
          recommendDataRef.current = data;
          navigate('recommend-story');
        }}
      />
    );
  }

  if (page === 'recommend-story' && recommendData) {
    return (
      <RecommendStoryPage
        data={recommendData}
        onBack={() => navigate('result')}
        onSubmit={async (finalData) => {
          await submitRecommendation(finalData);
          sessionStorage.removeItem(CACHE_KEY);
          invalidateRecsCache();
          navigate('recommend-complete');
        }}
      />
    );
  }

  if (page === 'recommend-complete') {
    return (
      <RecommendCompletePage
        goToSongLoading={ad.waiting}
        onGoToSong={() => {
          ad.show(() => {
            setRecommendData(null);
            setCameFromRecommend(true);
            try { sessionStorage.removeItem('tds-active-track-id'); } catch { /* ignore */ }
            navigate('result');
          });
        }}
      />
    );
  }

  if (page === 'result') {
    return (
      <ResultPage
        onClickRecommend={(url) => {
          if (url) {
            try { sessionStorage.setItem('tds-toast-dismissed-url', url); } catch { /* ignore */ }
          }
          setPrefillUrl(url);
          setCameFromRecommend(false);
          navigate('recommend-link');
        }}
        onGoHome={() => navigate('home')}
        skipClipboardToast={cameFromRecommend}
      />
    );
  }

  return (
    <>
      <HomePage
        onClickCTA={async () => {
          const ok = await login();
          if (!ok) return;
          ad.show(() => navigate('result'));
        }}
        ctaLoading={ad.waiting}
        ctaLabel={loggedIn ? '광고 보고 추천곡 확인하기' : '오늘의 추천곡 확인하기'}
      />
      <ConfirmDialog
        open={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
        title="뮤트를 종료할까요?"
        confirmButton={
          <Button size="large" onClick={() => {
            setCloseDialogOpen(false);
            try { closeView(); } catch { /* non-toss env */ }
          }}>종료하기</Button>
        }
        cancelButton={
          <Button size="large" variant="weak" onClick={() => setCloseDialogOpen(false)}>닫기</Button>
        }
      />
    </>
  );
}

export default App;
