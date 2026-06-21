import { Text, Badge } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import type { Track } from '../types';

interface TrackInfoProps {
  track: Track;
  isUserRecommendation: boolean;
}

export function TrackInfo({ track, isUserRecommendation }: TrackInfoProps) {
  return (
    <div
      style={{
        width: '100%',
        paddingInline: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {isUserRecommendation ? (
        <Badge size="small" variant="weak" color="yellow">
          유저 추천곡
        </Badge>
      ) : (
        <Badge size="small" variant="weak" color="blue">
          주인장 추천곡
        </Badge>
      )}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Text
          color={adaptive.background}
          typography="t4"
          fontWeight="semibold"
          textAlign="center"
          ellipsisAfterLines={2}
          style={{ width: '100%', minWidth: 0, wordBreak: 'break-word' }}
        >
          {track.title}
        </Text>
        <Text
          color={adaptive.background}
          typography="t5"
          fontWeight="regular"
          textAlign="center"
          ellipsisAfterLines={2}
          style={{ width: '100%' }}
        >
          {track.artistName}
        </Text>
      </div>
    </div>
  );
}
