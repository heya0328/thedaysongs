import { useMemo } from 'react';
import { Asset } from '@toss/tds-mobile';
import type { ReactionParticle } from '../types';

export function ReactionBurst({ reaction }: { reaction: ReactionParticle }) {
  const pieces = useMemo(() => reaction.pieces, [reaction.pieces]);
  const rings = useMemo(() => reaction.rings, [reaction.rings]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(${reaction.offsetX}px, ${-reaction.offsetY}px) scale(${reaction.burstSize})`,
        transformOrigin: 'center',
        animation: 'reaction-container 2.4s ease-out forwards',
        willChange: 'opacity, transform',
      }}
    >
      {/* 배경 글로우 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 160,
          height: 160,
          marginLeft: -80,
          marginTop: -80,
          borderRadius: '50%',
          backgroundColor: reaction.config.glow,
          filter: 'blur(48px)',
          animation: 'reaction-glow 1.8s ease-out forwards',
        }}
      />

      {/* 오빗 링 */}
      {rings.map((ring) => (
        <div
          key={ring.id}
          style={
            {
              position: 'absolute',
              left: 0,
              top: 0,
              width: ring.size,
              height: ring.size,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              ['--ring-rotate' as string]: `${ring.rotate}deg`,
              animation: `reaction-ring ${ring.duration}s ease-out forwards`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* 플로팅 이모지 조각들 */}
      {pieces.map((piece) => (
        <div
          key={piece.id}
          style={
            {
              position: 'absolute',
              left: 0,
              top: 0,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.35))',
              opacity: 0,
              ['--start-x' as string]: `${piece.startX}px`,
              ['--start-rotate' as string]: `${piece.rotate * 0.35}deg`,
              ['--mid-x' as string]: `${piece.startX + piece.driftX * 0.3}px`,
              ['--mid-y' as string]: `${-piece.lift * 0.25}px`,
              ['--mid-rotate' as string]: `${piece.rotate * 0.55}deg`,
              ['--mid-scale' as string]: `${piece.popScale}`,
              ['--end-x' as string]: `${piece.startX + piece.driftX}px`,
              ['--end-y' as string]: `${-piece.lift}px`,
              ['--end-rotate' as string]: `${piece.rotate}deg`,
              ['--end-scale' as string]: `${piece.endScale}`,
              animation: `reaction-float ${piece.duration}s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
              animationDelay: `${piece.delay}s`,
              willChange: 'transform, opacity',
            } as React.CSSProperties
          }
        >
          <div
            style={{
              width: piece.frameSize,
              height: piece.frameSize,
              marginLeft: -piece.frameSize / 2,
              marginTop: -piece.frameSize / 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Asset.Icon
              frameShape={{
                width: piece.frameSize,
                height: piece.frameSize,
                radius: 9999,
              }}
              backgroundColor="transparent"
              name={piece.iconName}
              scale={piece.iconScale}
              aria-hidden={true}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
