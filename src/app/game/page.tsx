'use client';

import { Suspense, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Difficulty } from '@/engine/types';
import { useGameStore } from '@/stores/useGameStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { saveRecord } from '@/lib/history';
import GameTable from '@/components/game/GameTable';
import SessionResultModal from '@/components/game/SessionResultModal';
import OnlineGameTable from '@/components/game/OnlineGameTable';

/** 오프라인 (AI 대전) 게임 */
function OfflineGameContent({ diff }: { diff: Difficulty }) {
  const router = useRouter();
  const phase = useGameStore(s => s.phase);
  const initGame = useGameStore(s => s.initGame);
  const winner = useGameStore(s => s.winner);
  const gameResult = useGameStore(s => s.gameResult);
  const turnCount = useGameStore(s => s.turnCount);
  const players = useGameStore(s => s.players);
  const _state = useGameStore(s => s._state);

  const session = useSessionStore(s => s.session);
  const isActive = useSessionStore(s => s.isActive);
  const startSession = useSessionStore(s => s.startSession);
  const recordRound = useSessionStore(s => s.recordRound);
  const getIsSessionOver = useSessionStore(s => s.getIsSessionOver);
  const getRanking = useSessionStore(s => s.getRanking);
  const getRoundHistory = useSessionStore(s => s.getRoundHistory);
  const endSession = useSessionStore(s => s.endSession);

  const savedRef = useRef(false);
  const recordedRoundRef = useRef(-1);

  useEffect(() => {
    savedRef.current = false;
    recordedRoundRef.current = -1;
    startSession(diff);
    initGame(diff);
  }, [diff, initGame, startSession]);

  useEffect(() => {
    if (phase !== 'game-over') return;
    if (savedRef.current) return;
    savedRef.current = true;

    const result = winner === 0 ? 'win' : winner === null ? 'draw' : 'lose';
    saveRecord({
      date: new Date().toISOString(),
      result,
      score: gameResult?.finalScore ?? 0,
      comboNames: gameResult?.combos.map(c => c.nameKo) ?? [],
      turns: Math.ceil(turnCount / 3),
      difficulty: diff,
    });

    if (_state && session && recordedRoundRef.current < session.currentRound) {
      recordedRoundRef.current = session.currentRound;
      recordRound(_state);
    }
  }, [phase, winner, gameResult, turnCount, diff, _state, session, recordRound]);

  const handleNextRound = useCallback(() => {
    savedRef.current = false;
    initGame(diff);
  }, [diff, initGame]);

  const handleRestartSession = useCallback(() => {
    endSession();
    savedRef.current = false;
    recordedRoundRef.current = -1;
    startSession(diff);
    initGame(diff);
  }, [diff, initGame, startSession, endSession]);

  const handleBackToMenu = useCallback(() => {
    endSession();
    router.push('/');
  }, [endSession, router]);

  if (phase === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-text-secondary text-sm">배패 중...</div>
      </div>
    );
  }

  const currentRound = session?.currentRound ?? 0;
  const maxRounds = session?.maxRounds ?? 3;
  const sessionOver = getIsSessionOver();
  const roundLabel = isActive ? `${maxRounds}판 중 ${currentRound + 1}번째` : undefined;

  if (phase === 'game-over' && sessionOver && isActive) {
    const playerNames = players.map(p => p.name);
    return (
      <>
        <GameTable onBackToMenu={handleBackToMenu} roundLabel={roundLabel} />
        <SessionResultModal
          ranking={getRanking()}
          roundHistory={getRoundHistory()}
          playerNames={playerNames}
          onRestart={handleRestartSession}
          onBackToMenu={handleBackToMenu}
        />
      </>
    );
  }

  return (
    <GameTable
      onBackToMenu={handleBackToMenu}
      onNextRound={phase === 'game-over' && !sessionOver && isActive ? handleNextRound : undefined}
      roundLabel={roundLabel}
    />
  );
}

/** 게임 라우터: 온라인/오프라인 분기 */
function GameContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const roomId = searchParams.get('roomId');
  const roomCode = searchParams.get('code');
  const diff = (searchParams.get('difficulty') as Difficulty) || 'normal';

  if (mode === 'online' && roomId && roomCode) {
    return <OnlineGameTable roomId={roomId} roomCode={roomCode} />;
  }

  return <OfflineGameContent diff={diff} />;
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-text-secondary text-sm">로딩 중...</div>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
