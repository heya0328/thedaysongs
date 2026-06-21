import { useEffect, useRef } from 'react';
import {
  TICKER_CARD_SIZE,
  TICKER_CARD_GAP,
  TICKER_CARD_RADIUS,
} from '../constants';

const CARD_SIZE = TICKER_CARD_SIZE;
const CARD_GAP = TICKER_CARD_GAP;
const CARD_RADIUS = TICKER_CARD_RADIUS;

interface AlbumTickerProps {
  row1: string[];
  row2: string[];
}

export function AlbumTicker({ row1, row2 }: AlbumTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 애니메이션을 위한 style 태그 주입
  useEffect(() => {
    const totalWidth = row1.length * (CARD_SIZE + CARD_GAP);
    const id = 'album-ticker-keyframes';
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes ticker-scroll-left {
        0% { transform: translateX(0); }
        100% { transform: translateX(-${totalWidth}px); }
      }
      @keyframes ticker-scroll-right {
        0% { transform: translateX(-${totalWidth}px); }
        100% { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [row1.length]);

  // 무한 루프를 위해 3배로 복제
  const row1Items = [...row1, ...row1, ...row1];
  const row2Items = [...row2, ...row2, ...row2];

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: CARD_GAP,
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        maskImage:
          'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
      }}
    >
      {/* 1번째 줄: 왼쪽으로 */}
      <div
        style={{
          display: 'flex',
          gap: CARD_GAP,
          width: 'max-content',
          animation: `ticker-scroll-left ${row1.length * 4}s linear infinite`,
        }}
      >
        {row1Items.map((src, i) => (
          <div
            key={`r1-${i}`}
            style={{
              width: CARD_SIZE,
              height: CARD_SIZE,
              flexShrink: 0,
              borderRadius: CARD_RADIUS,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* 2번째 줄: 오른쪽으로 */}
      <div
        style={{
          display: 'flex',
          gap: CARD_GAP,
          width: 'max-content',
          animation: `ticker-scroll-right ${row2.length * 5}s linear infinite`,
        }}
      >
        {row2Items.map((src, i) => (
          <div
            key={`r2-${i}`}
            style={{
              width: CARD_SIZE,
              height: CARD_SIZE,
              flexShrink: 0,
              borderRadius: CARD_RADIUS,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
