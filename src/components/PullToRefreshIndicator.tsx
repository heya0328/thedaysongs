import { keyframes } from '@emotion/react';
import { Asset, Text } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const THRESHOLD = 80;

interface Props {
  pullDistance: number;
  refreshing: boolean;
}

export function PullToRefreshIndicator({ pullDistance, refreshing }: Props) {
  if (pullDistance <= 0 && !refreshing) return null;

  // UI는 threshold 절반(40px)부터 나타나기 시작, 360° 회전 = 새로고침 트리거
  const UI_START = THRESHOLD / 2;
  const progress = Math.min(Math.max(0, (pullDistance - UI_START) / (THRESHOLD - UI_START)), 1);
  const rotation = progress * 360;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: pullDistance,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        zIndex: 10,
        overflow: 'hidden',
        transition: refreshing ? 'none' : pullDistance === 0 ? 'height 0.2s ease-out' : 'none',
      }}
    >
      <div
        style={{
          transform: refreshing ? undefined : `rotate(${rotation}deg)`,
          animation: refreshing ? `${spin} 0.8s linear infinite` : 'none',
          opacity: progress,
          transition: pullDistance === 0 ? 'opacity 0.2s ease-out' : 'none',
        }}
      >
        <Asset.Icon
          frameShape={Asset.frameShape.CircleSmall}
          backgroundColor="rgba(222,222,255,0.19)"
          name="icon-refresh-mono"
          color="rgba(255,255,255,1)"
          scale={0.66}
          aria-hidden={true}
        />
      </div>
      <div
        style={{
          opacity: progress,
          transition: pullDistance === 0 ? 'opacity 0.2s ease-out' : 'none',
        }}
      >
        <Text color={adaptive.background} typography="t6" fontWeight="regular">
          당겨서 새로고침
        </Text>
      </div>
    </div>
  );
}
