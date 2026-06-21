import { useCallback, useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { getAnonUserId } from './anonUserId';
import type { ReactionMessage } from '../../types';
import { SEND_THROTTLE_MS } from '../../constants';

export type { ReactionMessage };

const CHANNEL_NAME = 'reactions:global';
const EVENT_NAME = 'reaction';
const FUNCTION_NAME = 'react';

type Options = {
  enabled?: boolean;
  trackId?: string;
  onReceive: (key: string) => void;
};

export function useReactionChannel({ enabled = true, trackId, onReceive }: Options) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSendRef = useRef(0);
  const onReceiveRef = useRef(onReceive);
  const userIdRef = useRef<string>('');

  if (userIdRef.current === '') {
    userIdRef.current = getAnonUserId();
  }

  useEffect(() => {
    onReceiveRef.current = onReceive;
  }, [onReceive]);

  const subscribe = useCallback(() => {
    if (channelRef.current) return;
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { broadcast: { self: false, ack: false } },
    });
    channel.on('broadcast', { event: EVENT_NAME }, (payload) => {
      const message = payload.payload as ReactionMessage | undefined;
      if (!message || typeof message.key !== 'string') return;
      if (message.senderId === userIdRef.current) return;
      onReceiveRef.current(message.key);
    });
    channel.subscribe();
    channelRef.current = channel;
  }, []);

  const unsubscribe = useCallback(() => {
    if (!channelRef.current) return;
    supabase.removeChannel(channelRef.current);
    channelRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    subscribe();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        unsubscribe();
      } else {
        subscribe();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      unsubscribe();
    };
  }, [enabled, subscribe, unsubscribe]);

  const trackIdRef = useRef(trackId);
  useEffect(() => {
    trackIdRef.current = trackId;
  }, [trackId]);

  const sendReaction = useCallback((key: string) => {
    const now = Date.now();
    if (now - lastSendRef.current < SEND_THROTTLE_MS) return false;
    const userId = userIdRef.current;
    if (!userId) return false;
    lastSendRef.current = now;
    void supabase.functions
      .invoke(FUNCTION_NAME, { body: { key, userId, trackId: trackIdRef.current } })
      .catch(() => {
        // network or quota failure — drop silently, local animation still plays
      });
    return true;
  }, []);

  return { sendReaction };
}
