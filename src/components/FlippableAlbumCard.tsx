import { motion } from 'framer-motion';
import { Asset, Text, Spacing } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import type { Track } from '../types';

interface FlippableAlbumCardProps {
  track: Track;
  flipped: boolean;
  cardSize: number;
}

export function FlippableAlbumCard({ track, flipped, cardSize }: FlippableAlbumCardProps) {
  const textMaxHeight = cardSize * 0.7;

  return (
    <div style={{ width: '100%', height: '100%', perspective: 2200, borderRadius: 12, overflow: 'hidden' }}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{
          type: 'spring',
          stiffness: 140,
          damping: 18,
          mass: 1.05,
        }}
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front face — Album art */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            overflow: 'hidden',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg) translateZ(1px)',
          }}
        >
          <img
            src={track.albumImageUrl || '/logo_300.png'}
            alt={`${track.title} 앨범 아트`}
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo_300.png';
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Back face — Story */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            overflow: 'hidden',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(1px)',
            backgroundColor: '#000',
          }}
        >
          {/* Background: album image + blur */}
          <img
            src={track.albumImageUrl || '/logo_300.png'}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              top: -20,
              left: -20,
              width: 'calc(100% + 40px)',
              height: 'calc(100% + 40px)',
              objectFit: 'cover',
              filter: 'blur(24px) brightness(0.6)',
              pointerEvents: 'none',
            }}
          />
          {/* Dark overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
            }}
          />
          {/* Story text */}
          <div
            style={{
              position: 'relative',
              height: '100%',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {track.recommendationComment ? (
              <div
                style={{
                  maxHeight: textMaxHeight,
                  overflow: 'hidden',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, black 80%, transparent 100%)',
                  maskImage:
                    'linear-gradient(to bottom, black 80%, transparent 100%)',
                }}
              >
                <Text
                  color={adaptive.background}
                  typography="t5"
                  fontWeight="regular"
                  textAlign="center"
                  style={{ lineHeight: 1.6, wordBreak: 'break-word' }}
                >
                  {track.recommendationComment}
                </Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Asset.Icon
                  frameShape={{ width: 40, height: 40 }}
                  backgroundColor="transparent"
                  name="icon-document"
                  aria-hidden={true}
                  ratio="1/1"
                />
                <Spacing size={8} />
                <Text color={adaptive.background} typography="t6" fontWeight="medium">
                  사연이 없어요
                </Text>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
