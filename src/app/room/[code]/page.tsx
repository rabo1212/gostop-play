'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import type { RoomInfo } from '@/lib/online-types';

export default function WaitingRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { userId } = useAuthStore();

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isHost = room?.hostId === userId;

  // 방 정보 가져오기
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code.toUpperCase()}`);
      const data = await res.json();
      if (data.room) {
        setRoom(data.room);
        // 게임 시작됨 -> 게임 페이지로
        if (data.room.status === 'playing') {
          router.push(`/game?mode=online&roomId=${data.room.id}&code=${code.toUpperCase()}`);
        }
      } else {
        setError('방을 찾을 수 없습니다');
      }
    } catch {
      setError('네트워크 오류');
    }
    setLoading(false);
  }, [code, router]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // Realtime 구독 (방 업데이트)
  useEffect(() => {
    const channel = supabase.channel(`room:${code.toUpperCase()}`);

    channel
      .on('broadcast', { event: 'room_update' }, (payload) => {
        const data = payload.payload;
        if (data.type === 'disbanded') {
          router.push('/lobby');
          return;
        }
        if (data.status === 'playing' || data.type === 'player_joined' || data.type === 'player_left') {
          fetchRoom();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, fetchRoom, router]);

  // 게임 시작
  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`/api/rooms/${code.toUpperCase()}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.started) {
        router.push(`/game?mode=online&roomId=${data.roomId}&code=${code.toUpperCase()}`);
      } else {
        setError(data.error || '시작 실패');
      }
    } catch {
      setError('네트워크 오류');
    }
    setStarting(false);
  };

  // 방 나가기
  const handleLeave = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      await fetch(`/api/rooms/${code.toUpperCase()}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
    router.push('/lobby');
  };

  // 코드 복사
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-text-muted">로딩 중...</div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-base px-4">
        <div className="text-action-danger mb-4">{error || '방을 찾을 수 없습니다'}</div>
        <button
          onClick={() => router.push('/lobby')}
          className="text-sm text-text-muted hover:text-text-secondary cursor-pointer"
        >
          로비로 돌아가기
        </button>
      </main>
    );
  }

  const seatLabels = ['선', '중', '끝'];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-base px-4 py-8">
      {/* 방 코드 */}
      <div className="text-center mb-8">
        <p className="text-xs text-text-muted mb-1">방 코드</p>
        <button
          onClick={handleCopy}
          className="text-4xl font-mono font-bold tracking-[0.3em] text-gold
            hover:text-gold-light transition-colors cursor-pointer"
        >
          {code.toUpperCase()}
        </button>
        <p className="text-xs text-text-muted mt-1">
          {copied ? '복사됨!' : '터치하여 복사'}
        </p>
      </div>

      {/* 좌석 */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {[0, 1, 2].map(seatIdx => {
          const player = room.players.find(p => p.seatIndex === seatIdx);
          return (
            <div
              key={seatIdx}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                player
                  ? 'bg-panel border-gold/20'
                  : 'bg-panel/40 border-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                player ? 'bg-gold/20 text-gold' : 'bg-white/5 text-text-muted'
              }`}>
                {seatLabels[seatIdx]}
              </div>
              <div className="flex-1">
                {player ? (
                  <div>
                    <span className="font-bold text-text-primary">{player.nickname}</span>
                    {player.id === room.hostId && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold">방장</span>
                    )}
                  </div>
                ) : (
                  <span className="text-text-muted text-sm">빈 자리 (AI로 채워짐)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 설정 정보 */}
      <div className="flex gap-4 text-xs text-text-muted mb-6">
        <span>난이도: {room.difficulty === 'easy' ? '쉬움' : room.difficulty === 'normal' ? '보통' : '어려움'}</span>
        <span>{room.roundCount}판</span>
      </div>

      {/* 에러 */}
      {error && (
        <div className="text-sm text-action-danger mb-4 animate-fade-in">{error}</div>
      )}

      {/* 버튼 */}
      <div className="w-full max-w-sm space-y-3">
        {isHost && (
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full py-3.5 rounded-xl font-bold text-lg transition-all cursor-pointer
              bg-gradient-to-r from-gold-dark via-gold to-gold-light text-text-on-gold
              hover:shadow-gold-glow active:scale-[0.98] disabled:opacity-50"
          >
            {starting ? '시작 중...' : '게임 시작'}
          </button>
        )}
        {!isHost && (
          <div className="text-center text-sm text-text-muted py-3">
            방장이 게임을 시작할 때까지 기다려주세요
          </div>
        )}
        <button
          onClick={handleLeave}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer
            bg-panel-light border border-white/10 text-text-secondary
            hover:border-action-danger/40 hover:text-action-danger"
        >
          나가기
        </button>
      </div>
    </main>
  );
}
