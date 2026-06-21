import { Top, Text, BottomCTA } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { AlbumTicker } from '../components/AlbumTicker';

const ALL_ALBUM_ARTS = Array.from({ length: 10 }, (_, i) => `/albumArt/${i + 1}.jpeg`);

// 셔플 (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SHUFFLED = shuffle(ALL_ALBUM_ARTS);
const TICKER_ROW1 = SHUFFLED.slice(0, 5);
const TICKER_ROW2 = SHUFFLED.slice(5, 10);

interface HomePageProps {
  onClickCTA: () => void;
  ctaLoading?: boolean;
  ctaLabel?: string;
}

function formatTodayDate(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dayNames = [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
  ];
  return `${month}월 ${day}일 ${dayNames[now.getDay()]}`;
}

export function HomePage({ onClickCTA, ctaLoading, ctaLabel }: HomePageProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 상단 영역: 타이틀 + 날짜 */}
      <Top
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            오늘의 추천 음악
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph>
            매일 한 곡씩 엄선한 노래를 추천해드려요.
          </Top.SubtitleParagraph>
        }
        lowerGap={0}
      />
      <div
        style={{
          width: '100%',
          paddingBlock: 16,
          paddingInline: 24,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}
      >
        <Text
          color={adaptive.grey500}
          typography="t5"
          fontWeight="medium"
        >
          {formatTodayDate()}
        </Text>
      </div>

      {/* 중앙 영역: 앨범 아트 티커 */}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <AlbumTicker row1={TICKER_ROW1} row2={TICKER_ROW2} />
      </div>

      {/* 하단 CTA */}
      <BottomCTA.Single
        background="none"
        onClick={onClickCTA}
        containerStyle={{ width: '100%' }}
        loading={ctaLoading}
      >
        {ctaLabel ?? '광고 보고 추천곡 확인하기'}
      </BottomCTA.Single>
    </div>
  );
}
