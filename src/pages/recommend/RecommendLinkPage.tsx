import { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/react';
import {
  Top,
  TextField,
  BottomCTA,
  BottomSheet,
  Tab,
  Result,
  Asset,
  Button,
  useToast,
} from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { supabase, extractFunctionErrorReason } from '../../lib/supabase';
import { isMusicUrl, readClipboardSilent } from '../../lib/musicUrl';
import type { RecommendData } from './types';
import { useBannerAd } from '../../hooks/useBannerAd';

/** edge function 에러 코드 → 한국어 메시지 */
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  unsupported_platform: {
    title: '지원하지 않는 플랫폼이에요',
    description:
      'Spotify, Apple Music, YouTube Music,\nYouTube 링크만 지원해요.',
  },
  invalid_url: {
    title: '올바른 링크를 입력해주세요',
    description: '음악 플랫폼의 공유 링크를 붙여넣어 주세요.',
  },
  missing_url: {
    title: '링크를 입력해주세요',
    description: '음악 플랫폼의 공유 링크를 붙여넣어 주세요.',
  },
  parse_error: {
    title: '음악 정보를 가져올 수 없었어요',
    description:
      '링크를 다시 확인해주세요.\n문제가 반복되면 다른 플랫폼 링크를 시도해보세요.',
  },
  network_error: {
    title: '네트워크 연결을 확인해주세요',
    description: '인터넷 연결 상태를 확인한 후 다시 시도해주세요.',
  },
};

/** 인풋 필드에서 에러로 표시할 코드 → 헬프메시지 */
const INPUT_ERROR_MESSAGES: Record<string, string> = {
  unsupported_platform: '사용할 수 없는 링크예요. 형식을 확인해주세요.',
  unsupported_format: '플레이리스트가 아닌 개별 곡 링크를 공유해주세요.',
  invalid_url: '사용할 수 없는 링크예요. 형식을 확인해주세요.',
};

const DEFAULT_ERROR = {
  title: '잠시 후 다시 시도해주세요',
  description: '잠시 문제가 생겨 노래를 등록하지 못했어요.\n문제가 반복되면 고객센터에 문의해주세요.',
};

const GUIDE_TABS = [
  { label: '스포티파이', image: '/guide/spotify.png' },
  { label: '애플 뮤직', image: '/guide/appleMusic.png' },
  { label: '유튜브 뮤직', image: '/guide/youtube music.png' },
  { label: '유튜브', image: '/guide/youtube.png' },
];

interface Props {
  onNext: (data: Omit<RecommendData, 'story'>) => void;
  onBack: () => void;
  initialUrl?: string;
}

export function RecommendLinkPage({ onNext, onBack, initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [parsing, setParsing] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState(0);
  const { openToast } = useToast();
  const openToastRef = useRef(openToast);
  openToastRef.current = openToast;

  // 마운트 시 스크롤 top 0
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // initialUrl 없이 직접 진입했을 때 클립보드에 음악 링크가 있으면 프리필 + 토스트
  useEffect(() => {
    if (initialUrl) return;

    readClipboardSilent().then((text) => {
      const trimmed = text.trim();
      if (trimmed && isMusicUrl(trimmed)) {
        setUrl(trimmed);
        openToastRef.current('복사한 음악 링크를 입력했어요.', { type: 'top' });
      }
    }).catch(() => {
      // 클립보드 읽기 권한 없음 — 무시
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setParsing(true);
    setErrorCode(null);
    setInputError(null);

    try {
      let data: Record<string, unknown> | null = null;
      let fnError: Error | null = null;

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('network_error')), 15000),
        );
        const fetchPromise = supabase.functions.invoke(
          'extract-metadata',
          { body: { url: trimmed } },
        );
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        data = result.data;
        fnError = result.error;
      } catch {
        throw new Error('network_error');
      }

      if (fnError) {
        const reason = await extractFunctionErrorReason(fnError);
        throw new Error(reason);
      }

      if (!data?.ok) {
        throw new Error(data?.reason ?? 'parse_error');
      }

      onNext({
        url: trimmed,
        title: data.title,
        artist: data.artist || '알 수 없는 아티스트',
        imageUrl: data.imageUrl,
        platform: data.platform,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unknown';
      // 인풋 에러로 표시할 수 있는 코드면 인풋 에러로, 아니면 전체 에러 화면
      if (INPUT_ERROR_MESSAGES[code]) {
        setInputError(INPUT_ERROR_MESSAGES[code]);
      } else {
        setErrorCode(code);
      }
    } finally {
      setParsing(false);
    }
  };

  // 에러 화면
  if (errorCode) {
    const msg = ERROR_MESSAGES[errorCode] ?? DEFAULT_ERROR;
    return (
      <div css={containerStyle}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Result
            title={msg.title}
            description={msg.description}
            figure={
              <Asset.Image
                frameShape={Asset.frameShape.CleanW60}
                src="https://static.toss.im/icons/png/4x/icon-warning-circle-fill.png"
                aria-hidden={true}
              />
            }
            button={
              <Result.Button
                onClick={() => {
                  setErrorCode(null);
                }}
              >
                다시 시도하기
              </Result.Button>
            }
          />
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <Button size="large" display="block" onClick={onBack}>
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const bannerRef = useBannerAd();
  const hasUrl = url.trim().length > 0;

  return (
    <div css={containerStyle}>
      <Top
        title={
          <Top.TitleParagraph size={22} color={adaptive.grey900}>
            음악 링크를 공유해주세요
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            스포티파이, 애플 뮤직, 유튜브 뮤직,{'\n'}유튜브 링크 4개를 지원해요.
          </Top.SubtitleParagraph>
        }
      />
      <div style={{ paddingLeft: 20, paddingBottom: 8 }}>
        <Button
          color="dark"
          size="small"
          variant="weak"
          display="inline"
          onClick={() => setGuideOpen(true)}
        >
          공유 방법 보기
        </Button>
      </div>

      <div css={contentStyle}>
        <TextField.Clearable
          variant="box"
          label="음악 링크"
          labelOption="sustain"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (inputError) setInputError(null);
          }}
          onClear={() => {
            setUrl('');
            if (inputError) setInputError(null);
          }}
          placeholder="예: https://open.spotify.com/track/..."
          error={!!inputError}
          help={inputError ?? undefined}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* 배너 광고 */}
      <div ref={bannerRef} style={{ width: '100%', height: 96 }} />

      <BottomCTA.Single
        disabled={!hasUrl || parsing}
        onClick={handleNext}
        background="none"
      >
        {parsing ? '링크 확인 중...' : '다음'}
      </BottomCTA.Single>

      {/* 공유 방법 가이드 바텀시트 */}
      <BottomSheet
        header={<BottomSheet.Header>링크 공유 방법</BottomSheet.Header>}
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        ctaContentGap={0}
      >
        <Tab
          fluid={false}
          size="small"
          style={{ backgroundColor: adaptive.background }}
        >
          {GUIDE_TABS.map((tab, i) => (
            <Tab.Item
              key={tab.label}
              selected={guideTab === i}
              backgroundColor={adaptive.background}
              onClick={() => setGuideTab(i)}
            >
              {tab.label}
            </Tab.Item>
          ))}
        </Tab>
        <img
          src={GUIDE_TABS[guideTab].image}
          alt={`${GUIDE_TABS[guideTab].label} 공유 방법`}
          style={{
            width: '100%',
            display: 'block',
          }}
        />
      </BottomSheet>
    </div>
  );
}

const containerStyle = css`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const contentStyle = css`
  padding: 0 20px;
`;
