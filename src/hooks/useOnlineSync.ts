'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOnlineGameStore } from '@/stores/useOnlineGameStore';
import { PRESET_MESSAGES, type ChatMessage } from '@/lib/online-types';

const POLL_INTERVAL_MS = 10_000;

/**
 * Supabase Realtime 구독 훅
 * - broadcast: 게임 상태 + 방 이벤트
 * - presence: 플레이어 연결 상태 추적
 * - 폴링 백업 + 탭 복귀 감지
 */
export function useOnlineSync(roomId: string | null, roomCode: string | null) {
  const store = useOnlineGameStore();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !roomCode) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    store.init(roomId, roomCode);
    store.fetchState();

    return () => {
      initializedRef.current = false;
      store.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomCode]);

  // seatIndex 확정 후 Realtime 구독
  useEffect(() => {
    if (!roomCode || store.seatIndex === null) return;

    const seatIndex = store.seatIndex;

    const channel = supabase.channel(`room:${roomCode}`, {
      config: { broadcast: { self: false } },
    })
      .on('broadcast', { event: `game_state:${seatIndex}` }, (payload) => {
        const { gameState, version } = payload.payload;
        if (gameState && version !== undefined) {
          store.setGameState(gameState, version);
        }
      })
      .on('broadcast', { event: 'room_update' }, (payload) => {
        const data = payload.payload;
        if (data?.status === 'finished') {
          store.fetchState();
        } else if (data?.status === 'rematch') {
          useOnlineGameStore.setState({ version: -1 });
          store.fetchState();
        }
      })
      .on('broadcast', { event: 'chat' }, (payload) => {
        const msg = payload.payload as ChatMessage;
        if (
          msg &&
          typeof msg.seatIndex === 'number' &&
          msg.seatIndex >= 0 && msg.seatIndex <= 2 &&
          typeof msg.messageIndex === 'number' &&
          msg.messageIndex >= 0 && msg.messageIndex < PRESET_MESSAGES.length
        ) {
          store.addChatMessage(msg);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState() as Record<string, { seatIndex?: number }[]>;
        store.updatePresence(presenceState);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({ seatIndex });
          } catch { /* ignore */ }
          store.setConnectionStatus('connected');
          store.fetchState();
        } else if (status === 'CHANNEL_ERROR') {
          store.setConnectionStatus('reconnecting');
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          store.setConnectionStatus('disconnected');
        }
      });

    channelRef.current = channel;
    store.setRealtimeChannel(channel);

    // 폴링 백업
    const pollId = setInterval(() => {
      const connStatus = useOnlineGameStore.getState().connectionStatus;
      if (connStatus !== 'connected') {
        store.fetchState();
      }
    }, POLL_INTERVAL_MS);

    // 탭 복귀 감지
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        store.fetchState();
        if (channelRef.current) {
          channelRef.current.track({ seatIndex }).catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      store.setRealtimeChannel(null);
      clearInterval(pollId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, store.seatIndex]);
}
