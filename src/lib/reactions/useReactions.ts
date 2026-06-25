import { useCallback, useEffect, useRef, useState } from 'react';
import type { EmojiConfig, ReactionParticle } from '../../types';
import { MAX_CONCURRENT_REACTIONS, REACTION_TIMEOUT_MS } from '../../constants';
import { useReactionChannel } from './useReactionChannel';
import { EMOJIS, buildFloatingPieces, buildOrbitRings } from './reactionUtils';

const REACTION_MODE =
  (import.meta.env.VITE_REACTION_MODE as string | undefined) ?? 'broadcast';

const LIMIT_TOAST_TRIGGER = 3; // n번째 클릭에 토스트
const LIMIT_TOAST_COOLDOWN = 3000; // 토스트 후 쿨다운(ms)

type UseReactionsOptions = {
  trackId?: string;
  onReactionSent?: () => void;
  onReactionLimitReached?: () => void;
};

export function useReactions(options: UseReactionsOptions = {}) {
  const { trackId, onReactionSent, onReactionLimitReached } = options;
  const onReactionSentRef = useRef(onReactionSent);
  const onLimitRef = useRef(onReactionLimitReached);

  const clickCountRef = useRef(0);
  const toastCooldownRef = useRef(false);
  const prevTrackIdRef = useRef(trackId);

  const [activeReactions, setActiveReactions] = useState<ReactionParticle[]>([]);

  useEffect(() => {
    onReactionSentRef.current = onReactionSent;
  }, [onReactionSent]);

  useEffect(() => {
    onLimitRef.current = onReactionLimitReached;
  }, [onReactionLimitReached]);

  // trackId 변경 시 카운트 리셋
  useEffect(() => {
    if (prevTrackIdRef.current !== trackId) {
      prevTrackIdRef.current = trackId;
      clickCountRef.current = 0;
    }
  }, [trackId]);

  const addReaction = useCallback((config: EmojiConfig) => {
    const id = Date.now() + Math.floor(Math.random() * 10_000);
    const particle: ReactionParticle = {
      id,
      config,
      offsetX: Math.round((Math.random() - 0.5) * 140),
      offsetY: Math.round(Math.random() * 36),
      burstSize: 0.92 + Math.random() * 0.32,
      pieces: buildFloatingPieces(config, id),
      rings: buildOrbitRings(id),
    };
    setActiveReactions((current) => {
      const next = [...current, particle];
      return next.length > MAX_CONCURRENT_REACTIONS
        ? next.slice(next.length - MAX_CONCURRENT_REACTIONS)
        : next;
    });
    window.setTimeout(() => {
      setActiveReactions((current) => current.filter((item) => item.id !== id));
    }, REACTION_TIMEOUT_MS);
  }, []);

  const handleRemoteReaction = useCallback((key: string) => {
    const config = EMOJIS.find((emoji) => emoji.key === key);
    if (!config) return;
    addReaction(config);
  }, [addReaction]);

  const { sendReaction } = useReactionChannel({
    enabled: REACTION_MODE === 'broadcast',
    trackId,
    onReceive: handleRemoteReaction,
  });

  const handleEmojiClick = useCallback(
    (emoji: EmojiConfig) => {
      addReaction(emoji);
      sendReaction(emoji.key);
      onReactionSentRef.current?.();

      // 리액션 제한 토스트
      clickCountRef.current += 1;
      if (clickCountRef.current >= LIMIT_TOAST_TRIGGER && !toastCooldownRef.current) {
        onLimitRef.current?.();
        toastCooldownRef.current = true;
        clickCountRef.current = 0;
        window.setTimeout(() => {
          toastCooldownRef.current = false;
        }, LIMIT_TOAST_COOLDOWN);
      }
    },
    [addReaction, sendReaction],
  );

  return { activeReactions, handleEmojiClick };
}
