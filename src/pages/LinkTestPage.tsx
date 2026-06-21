import { useState } from 'react';
import { css } from '@emotion/react';
import { Top, Text, Button, TextField } from '@toss/tds-mobile';
import { supabase, extractFunctionErrorReason } from '../lib/supabase';

interface ParsedMetadata {
  platform: string;
  title: string;
  artist: string;
  imageUrl: string;
  originalUrl: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function LinkTestPage({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [metadata, setMetadata] = useState<ParsedMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleParse = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setStatus('loading');
    setMetadata(null);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.functions.invoke(
        'extract-metadata',
        { body: { url: trimmedUrl } },
      );

      if (error) {
        const reason = await extractFunctionErrorReason(error, error.message);
        throw new Error(reason);
      }

      if (!data?.ok) {
        throw new Error(data?.reason ?? 'Unknown error');
      }

      setMetadata({
        platform: data.platform,
        title: data.title,
        artist: data.artist,
        imageUrl: data.imageUrl,
        originalUrl: data.originalUrl,
      });
      setStatus('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : '파싱에 실패했습니다.',
      );
      setStatus('error');
    }
  };

  return (
    <div css={containerStyle}>
      <Top
        title={<Top.TitleParagraph size={22}>링크 파싱 테스트</Top.TitleParagraph>}
        lowerGap={0}
      />

      <div css={contentStyle}>
        <Text typography="t3" style={{ marginBottom: 8 }}>
          음악 링크를 입력하세요
        </Text>
        <Text typography="t6" color="grey600" style={{ marginBottom: 24 }}>
          Spotify, Apple Music, YouTube Music, Melon 링크를 지원합니다.
        </Text>

        <TextField
          variant="box"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="예: https://open.spotify.com/track/..."
          label="음악 링크"
          labelOption="sustain"
        />

        <div style={{ marginTop: 16 }}>
          <Button
            size="large"
            display="block"
            onClick={handleParse}
            disabled={!url.trim() || status === 'loading'}
          >
            {status === 'loading' ? '파싱 중...' : '파싱 테스트'}
          </Button>
        </div>

        {status === 'error' && (
          <div css={errorStyle}>
            <Text typography="t6" color="red500">
              {errorMessage}
            </Text>
          </div>
        )}

        {status === 'success' && metadata && (
          <div css={resultStyle}>
            <Text typography="t4" style={{ marginBottom: 16 }}>
              파싱 결과
            </Text>

            {metadata.imageUrl && (
              <div css={imageContainerStyle}>
                <img
                  src={metadata.imageUrl}
                  alt="Album Art"
                  css={albumArtStyle}
                />
              </div>
            )}

            <div css={metadataListStyle}>
              <MetadataRow label="플랫폼" value={metadata.platform} />
              <MetadataRow label="곡 제목" value={metadata.title || '(없음)'} />
              <MetadataRow
                label="아티스트"
                value={metadata.artist || '(없음)'}
              />
              <MetadataRow
                label="이미지 URL"
                value={metadata.imageUrl || '(없음)'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div css={rowStyle}>
      <Text typography="t7" color="grey600" style={{ minWidth: 72 }}>
        {label}
      </Text>
      <Text
        typography="t6"
        style={{ wordBreak: 'break-all', flex: 1 }}
      >
        {value}
      </Text>
    </div>
  );
}

const containerStyle = css`
  min-height: 100vh;
  background: var(--adaptiveGrey50);
`;

const contentStyle = css`
  padding: 24px 20px;
`;

const errorStyle = css`
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--red50, #fff5f5);
  border-radius: 8px;
`;

const resultStyle = css`
  margin-top: 24px;
  padding: 20px;
  background: var(--adaptiveWhite);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const imageContainerStyle = css`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
`;

const albumArtStyle = css`
  width: 200px;
  height: 200px;
  border-radius: 12px;
  object-fit: cover;
`;

const metadataListStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const rowStyle = css`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;
