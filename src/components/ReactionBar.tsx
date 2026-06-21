import type { ReactNode } from 'react';
import { Global, css } from '@emotion/react';
import { Asset } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import type { EmojiConfig, ReactionParticle } from '../types';
import { EMOJIS } from '../lib/reactions/reactionUtils';
import { ReactionBurst } from './ReactionBurst';

const reactionKeyframes = css`
  @keyframes reaction-float {
    0% {
      opacity: 0;
      transform: translate(var(--start-x), 0px) rotate(var(--start-rotate))
        scale(0.5);
    }
    15% {
      opacity: 1;
      transform: translate(var(--mid-x), var(--mid-y)) rotate(var(--mid-rotate))
        scale(var(--mid-scale));
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(var(--end-x), var(--end-y)) rotate(var(--end-rotate))
        scale(var(--end-scale));
    }
  }
  @keyframes reaction-glow {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.6);
    }
    30% {
      opacity: 0.9;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.2);
    }
  }
  @keyframes reaction-ring {
    0% {
      opacity: 0.55;
      transform: translate(-50%, -50%) scale(0.2) rotate(var(--ring-rotate));
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.7)
        rotate(calc(var(--ring-rotate) + 18deg));
    }
  }
  @keyframes reaction-container {
    0% {
      opacity: 0;
    }
    12% {
      opacity: 1;
    }
    85% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  @keyframes reaction-button-pop {
    0%,
    100% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.22);
    }
    60% {
      transform: scale(0.94);
    }
  }
  .reaction-emoji-button {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 0;
    margin: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }
  .reaction-emoji-button:active {
    animation: reaction-button-pop 0.4s ease-out;
  }
`;

interface ReactionBarProps {
  activeReactions: ReactionParticle[];
  onEmojiClick: (emoji: EmojiConfig) => void;
  formattedCount: string;
  children?: ReactNode;
}

export function ReactionBar({ activeReactions, onEmojiClick, formattedCount, children }: ReactionBarProps) {
  return (
    <>
      <Global styles={reactionKeyframes} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 40,
        }}
      >
        {/* 리액션 버스트 오버레이 — 이모지 pill 위쪽에서 터진다 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 140,
            width: 0,
            height: 0,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {activeReactions.map((reaction) => (
            <ReactionBurst key={reaction.id} reaction={reaction} />
          ))}
        </div>
        <div
          style={{
            width: 'fit-content',
            height: 'fit-content',
            backdropFilter: 'blur(0px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 'fit-content',
              height: 'fit-content',
              backdropFilter: 'blur(0px)',
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 'fit-content',
                height: 'fit-content',
                backgroundColor:
                  'var(--token-tds-color-white-opacity-100, var(--whiteOpacity100, rgba(217,217,255,0.11)))',
                borderRadius: 999,
                boxShadow:
                  'inset 0 0 0 1px var(--token-tds-color-white-opacity-100, var(--whiteOpacity100, rgba(217,217,255,0.11)))',
                padding: 12,
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'row',
                gap: 12,
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji.key}
                  type="button"
                  className="reaction-emoji-button"
                  aria-label={`${emoji.key} reaction`}
                  onClick={() => onEmojiClick(emoji)}
                >
                  <Asset.Icon
                    frameShape={Asset.frameShape.CircleMedium}
                    backgroundColor="rgba(222,222,255,0.19)"
                    name={emoji.iconName}
                    scale={0.66}
                    aria-hidden={true}
                  />
                </button>
              ))}
              {/* 구분선 */}
              <div
                style={{
                  width: 1,
                  height: 22,
                  backgroundColor: 'var(--token-tds-color-white-opacity-100, var(--whiteOpacity100, rgba(217,217,255,0.11)))',
                  borderRadius: 999,
                }}
              />
              {/* 카운트 */}
              <Asset.Text
                frameShape={Asset.frameShape.CircleMedium}
                backgroundColor="rgba(217,217,255,0.11)"
                style={{ color: adaptive.background, fontSize: '13px', fontWeight: 'bold' }}
                aria-label="reaction count"
              >
                {formattedCount}
              </Asset.Text>
            </div>
          </div>
          <div
            style={{
              width: 375,
              height: 'fit-content',
              backdropFilter: 'blur(0px)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: 24,
                backdropFilter: 'blur(0px)',
              }}
            />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
