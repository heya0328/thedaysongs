import { useState } from 'react';
import { css } from '@emotion/react';
import { Top, TextArea, BottomCTA, Result, Asset } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import type { RecommendData } from './types';
import { STORY_MAX_LENGTH } from '../../constants';
import { useBannerAd } from '../../hooks/useBannerAd';

interface Props {
  data: Omit<RecommendData, 'story'>;
  onSubmit: (data: RecommendData) => Promise<void>;
  onBack: () => void;
}

export function RecommendStoryPage({ data, onSubmit, onBack }: Props) {
  const bannerRef = useBannerAd();
  const [story, setStory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    setDuplicateError(false);

    try {
      await onSubmit({
        ...data,
        story: story.trim() || undefined,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'duplicate_recommendation') {
        setDuplicateError(true);
      } else {
        setError(true);
      }
      setSubmitting(false);
    }
  };

  if (duplicateError) {
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
            title="이미 추천된 음악이에요"
            description={`오늘 같은 음악이 이미 추천되었어요.\n다른 음악을 추천해보세요.`}
            figure={
              <Asset.Image
                frameShape={Asset.frameShape.CleanW60}
                src="https://static.toss.im/icons/png/4x/icon-warning-circle-fill.png"
                aria-hidden={true}
              />
            }
            button={
              <Result.Button onClick={onBack}>
                돌아가기
              </Result.Button>
            }
          />
        </div>
      </div>
    );
  }

  if (error) {
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
            title="잠시 후 다시 시도해주세요"
            description={`잠시 문제가 생겨 노래를 등록하지 못했어요.\n문제가 반복되면 고객센터에 문의해주세요.`}
            figure={
              <Asset.Image
                frameShape={Asset.frameShape.CleanW60}
                src="https://static.toss.im/icons/png/4x/icon-warning-circle-fill.png"
                aria-hidden={true}
              />
            }
            button={
              <Result.Button onClick={() => setError(false)}>
                다시 시도하기
              </Result.Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div css={containerStyle}>
      <Top
        title={
          <Top.TitleParagraph size={22} color={adaptive.grey900}>
            사연을 작성해주세요
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            내가 추천한 음악과 함께 보여요.
          </Top.SubtitleParagraph>
        }
      />

      <div css={contentStyle}>
        <TextArea
          variant="box"
          label="사연"
          labelOption="sustain"
          value={story}
          onChange={(e) => {
            if (e.target.value.length <= STORY_MAX_LENGTH) {
              setStory(e.target.value);
            }
          }}
          placeholder="(선택) 노래와 관련된 사연을 작성해주세요."
          minHeight={120}
          help={`${story.length}/${STORY_MAX_LENGTH}`}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* 배너 광고 */}
      <div ref={bannerRef} style={{ width: '100%', height: 96 }} />

      <BottomCTA.Single
        disabled={submitting}
        onClick={handleSubmit}
      >
        {submitting ? '등록 중...' : '음악 추천하기'}
      </BottomCTA.Single>
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
