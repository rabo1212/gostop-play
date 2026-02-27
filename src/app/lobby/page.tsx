'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import type { RoomListItem } from '@/lib/online-types';

export default function LobbyPage() {
  const router = useRouter();
  const { nickname, isAuthenticated, isLoading, signInAnonymous, restoreSession } = useAuthStore();

  const [nicknameInput, setNicknameInput] = useState('');
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  // 세션 복원
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // 방 목록 조회
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
      const interval = setInterval(fetchRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchRooms]);

  // 닉네임 로그인
  const handleLogin = async () => {
    const name = nicknameInput.trim() || '플레이어';
    await signInAnonymous(name);
  };

  // 방 생성
  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ difficulty: 'normal', roundCount: 3 }),
      });
      const data = await res.json();
      if (data.room?.code) {
        router.push(`/room/${data.room.code}`);
      } else {
        setError(data.error || '방 생성 실패');
      }
    } catch {
      setError('네트워크 오류');
    }
    setCreating(false);
  };

  // 코드로 참가
  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) {
      setError('4자리 방 코드를 입력해주세요');
      return;
    }
    setJoining(true);
    setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.room?.code) {
        router.push(`/room/${data.room.code}`);
      } else {
        setError(data.error || '참가 실패');
      }
    } catch {
      setError('네트워크 오류');
    }
    setJoining(false);
  };

  // 방 목록에서 참가
  const handleJoinRoom = async (code: string) => {
    setJoining(true);
    setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.room?.code) {
        router.push(`/room/${data.room.code}`);
      } else {
        setError(data.error || '참가 실패');
      }
    } catch {
      setError('네트워크 오류');
    }
    setJoining(false);
  };

  // 로그인 전 화면
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-base px-4">
        <h1
          className="text-3xl sm:text-5xl font-display font-bold text-gold mb-2"
          style={{ textShadow: '0 0 30px rgba(212,168,75,0.3)' }}
        >
          온라인 대전
        </h1>
        <p className="text-sm text-text-secondary mb-8">닉네임을 입력하고 시작하세요</p>

        <div className="w-full max-w-sm space-y-4">
          <input
            type="text"
            placeholder="닉네임 (최대 8자)"
            maxLength={8}
            value={nicknameInput}
            onChange={e => setNicknameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 rounded-xl bg-panel border border-white/10
              text-text-primary placeholder:text-text-muted text-center text-lg
              focus:outline-none focus:border-gold/40"
          />
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-lg transition-all cursor-pointer
              bg-gradient-to-r from-gold-dark via-gold to-gold-light text-text-on-gold
              hover:shadow-gold-glow active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? '접속 중...' : '시작'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2 text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            AI 대전으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  // 로그인 후 로비
  return (
    <main className="min-h-screen flex flex-col bg-base px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          ← 메인
        </button>
        <div className="text-sm text-text-secondary">
          <span className="text-gold font-bold">{nickname}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full space-y-6">
        {/* 방 생성 */}
        <div className="bg-panel rounded-2xl border border-white/5 p-5">
          <h2 className="text-lg font-display font-bold text-gold mb-4">방 만들기</h2>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 rounded-xl font-bold transition-all cursor-pointer
              bg-gradient-to-r from-gold-dark via-gold to-gold-light text-text-on-gold
              hover:shadow-gold-glow active:scale-[0.98] disabled:opacity-50"
          >
            {creating ? '생성 중...' : '새 방 만들기'}
          </button>
        </div>

        {/* 코드 참가 */}
        <div className="bg-panel rounded-2xl border border-white/5 p-5">
          <h2 className="text-lg font-display font-bold text-text-primary mb-4">코드로 참가</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ABCD"
              maxLength={4}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-panel-light border border-white/10
                text-text-primary placeholder:text-text-muted text-center text-lg font-mono tracking-[0.3em]
                focus:outline-none focus:border-gold/40 uppercase"
            />
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer
                bg-panel-light border border-white/10 text-text-primary
                hover:border-gold/40 hover:text-gold disabled:opacity-50"
            >
              참가
            </button>
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div className="text-center text-sm text-action-danger animate-fade-in">
            {error}
          </div>
        )}

        {/* 방 목록 */}
        <div>
          <h2 className="text-sm font-bold text-text-secondary mb-3">
            대기 중인 방 ({rooms.length})
          </h2>
          {rooms.length === 0 ? (
            <div className="text-center text-sm text-text-muted py-8">
              대기 중인 방이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => handleJoinRoom(room.code)}
                  disabled={joining}
                  className="w-full bg-panel rounded-xl border border-white/5 p-4
                    hover:border-gold/30 transition-all cursor-pointer text-left
                    disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-text-primary">{room.hostNickname}</span>
                      <span className="text-text-muted text-xs ml-2">#{room.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">
                        {room.playerCount}/3
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gold/10 text-gold">
                        {room.difficulty === 'easy' ? '쉬움' : room.difficulty === 'normal' ? '보통' : '어려움'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
