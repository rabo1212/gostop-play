'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOnlineGameStore } from '@/stores/useOnlineGameStore';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { deserializeTableCards } from '@/engine/dto';
import { calculateScore } from '@/engine/scoring';
import { playCardPlace, playCardCapture, playEvent, playGo, playStop, playGameOver } from '@/lib/sound';
import type { CardId } from '@/engine/types';

import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import TableField from './TableField';
import DrawPile from './DrawPile';
import CapturedCards from './CapturedCards';
import ScoreBoard from './ScoreBoard';
import EventPopup from './EventPopup';
import GoStopModal from './GoStopModal';
import AnimationLayer from './AnimationLayer';
import TurnTimer from './TurnTimer';
import ChatPanel from './ChatPanel';

interface OnlineGameTableProps {
  roomId: string;
  roomCode: string;
}

export default function OnlineGameTable({ roomId, roomCode }: OnlineGameTableProps) {
  const router = useRouter();
  const soundEnabled = useSettingsStore(s => s.soundEnabled);

  // Realtime 구독
  useOnlineSync(roomId, roomCode);

  const gameState = useOnlineGameStore(s => s.gameState);
  const seatIndex = useOnlineGameStore(s => s.seatIndex);
  const sendAction = useOnlineGameStore(s => s.sendAction);
  const actionPending = useOnlineGameStore(s => s.actionPending);
  const connectionStatus = useOnlineGameStore(s => s.connectionStatus);
  const isLoading = useOnlineGameStore(s => s.isLoading);
  const error = useOnlineGameStore(s => s.error);

  const [showEvent, setShowEvent] = useState(false);
  const [prevEvent, setPrevEvent] = useState('none');

  // 플레이어 회전 (gameState 없으면 빈 배열)
  const rotatedPlayers = useMemo(() => {
    if (!gameState || seatIndex === null) return [];
    const result = [];
    for (let i = 0; i < gameState.players.length; i++) {
      result.push(gameState.players[(i + seatIndex) % gameState.players.length]);
    }
    return result;
  }, [gameState, seatIndex]);

  const myPlayer = rotatedPlayers[0];
  const opponents = rotatedPlayers.slice(1);

  // 테이블 카드 Map 변환
  const tableCardsMap = useMemo(
    () => gameState ? deserializeTableCards(gameState.tableCards) : new Map(),
    [gameState]
  );

  // 점수 계산
  const myScore = useMemo(
    () => myPlayer ? calculateScore(myPlayer.captured, myPlayer.goCount) : null,
    [myPlayer]
  );

  // 이벤트 팝업
  useEffect(() => {
    if (!gameState) return;
    if (gameState.lastEvent && gameState.lastEvent !== 'none' && gameState.lastEvent !== prevEvent) {
      setShowEvent(true);
      setPrevEvent(gameState.lastEvent);
      if (soundEnabled) playEvent();
      const timer = setTimeout(() => setShowEvent(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState, prevEvent, soundEnabled]);

  // 게임 종료 사운드
  useEffect(() => {
    if (gameState?.phase === 'game-over' && soundEnabled) {
      playGameOver();
    }
  }, [gameState?.phase, soundEnabled]);

  // 카드 클릭 (내기)
  const handleCardClick = useCallback((cardId: CardId) => {
    if (!gameState || seatIndex === null) return;
    const rotatedTurn = (gameState.turnIndex - seatIndex + 3) % 3;
    if (rotatedTurn !== 0 || gameState.phase !== 'play-hand' || actionPending) return;
    if (soundEnabled) playCardPlace();
    sendAction({ type: 'play-hand-card', cardId });
  }, [gameState, seatIndex, actionPending, sendAction, soundEnabled]);

  // 매칭 선택
  const handleMatchSelect = useCallback((targetId: CardId) => {
    if (actionPending) return;
    if (soundEnabled) playCardCapture();
    sendAction({ type: 'select-match-target', targetId });
  }, [actionPending, sendAction, soundEnabled]);

  // 고/스톱
  const handleGo = useCallback(() => {
    if (soundEnabled) playGo();
    sendAction({ type: 'declare-go' });
  }, [sendAction, soundEnabled]);

  const handleStop = useCallback(() => {
    if (soundEnabled) playStop();
    sendAction({ type: 'declare-stop' });
  }, [sendAction, soundEnabled]);

  // 폭탄
  const handleBomb = useCallback((month: number) => {
    sendAction({ type: 'declare-bomb', month });
  }, [sendAction]);

  // 타임아웃
  const handleTimeout = useCallback(() => {
    sendAction({ type: 'timeout' });
  }, [sendAction]);

  // 로딩 상태
  if (!gameState || seatIndex === null || !myPlayer || !myScore) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-base">
        <div className="text-text-secondary text-sm">
          {isLoading ? '게임 로딩 중...' : error || '연결 중...'}
        </div>
      </div>
    );
  }

  const phase = gameState.phase;
  const rotatedTurnIndex = (gameState.turnIndex - seatIndex + 3) % 3;
  const isMyTurn = rotatedTurnIndex === 0;
  const isMatchSelect = isMyTurn && (phase === 'hand-match-select' || phase === 'draw-match-select');

  // 고/스톱 모달 표시 조건
  const showGoStop = phase === 'go-stop-decision' &&
    gameState.goStopPlayer !== null &&
    ((gameState.goStopPlayer - seatIndex + 3) % 3) === 0;

  const turnPlayerName = rotatedPlayers[rotatedTurnIndex]?.name || '';

  return (
    <div className="table-bg fixed inset-0 flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">

      {/* 연결 상태 배너 */}
      {connectionStatus !== 'connected' && (
        <div className={`text-center text-xs py-1 ${
          connectionStatus === 'reconnecting'
            ? 'bg-gold/20 text-gold'
            : 'bg-action-danger/20 text-action-danger'
        }`}>
          {connectionStatus === 'reconnecting' ? '재연결 중...' : '연결 끊김'}
        </div>
      )}

      {/* 상단: 상대 플레이어 (압축) */}
      <div className="flex justify-around items-start pt-1 px-2 shrink-0">
        {opponents.map((opp, i) => (
          <div key={opp.id} className="flex flex-col items-center">
            <OpponentHand
              cardCount={opp.handCount}
              name={opp.name}
              goCount={opp.goCount}
              id={i + 1}
            />
            <CapturedCards captured={opp.captured} compact playerId={i + 1} />
          </div>
        ))}
      </div>

      {/* 중앙: 바닥패 + 뽑을패 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1 px-2 min-h-0">
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="px-2 py-0.5 rounded bg-white/5 text-text-muted font-bold text-[10px]">
            온라인
          </span>
          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
            isMyTurn ? 'bg-gold/20 text-gold' : 'bg-white/10 text-text-muted'
          }`}>
            {isMyTurn ? '내 차례' : `${turnPlayerName} 차례`}
          </span>
          {isMyTurn && (
            <TurnTimer
              deadlineMs={gameState.turnDeadlineMs}
              onTimeout={handleTimeout}
            />
          )}
        </div>

        {isMatchSelect && (
          <div className="text-[11px] text-gold animate-pulse-gold px-2 py-0.5 rounded bg-gold/10 border border-gold/20 shrink-0">
            매칭할 카드를 선택하세요
          </div>
        )}

        <div className="flex items-center gap-3">
          <TableField
            tableCards={tableCardsMap}
            matchOptions={isMatchSelect ? gameState.pendingMatchOptions : []}
            onMatchSelect={isMatchSelect ? handleMatchSelect : undefined}
          />
          <DrawPile remaining={gameState.drawPileCount} />
        </div>
      </div>

      {/* 하단: 내 영역 */}
      <div className="pb-2 px-2 shrink-0" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {/* 점수 + 먹은 패 (가로 한 줄) */}
        <div className="flex items-center gap-1.5 mb-1">
          <ScoreBoard score={myScore} goCount={myPlayer.goCount} />
          <div className="flex-1 overflow-x-auto no-scrollbar">
            <CapturedCards captured={myPlayer.captured} playerId={0} />
          </div>
        </div>

        {gameState.myBombOptions.length > 0 && (
          <div className="flex justify-center gap-2 mb-1">
            {gameState.myBombOptions.map(month => (
              <button
                key={month}
                className="action-btn action-btn-go px-3 py-1 text-[11px]"
                onClick={() => handleBomb(month)}
                disabled={actionPending}
              >
                {month}월 폭탄!
              </button>
            ))}
          </div>
        )}

        <PlayerHand
          hand={myPlayer.hand}
          selectedCard={null}
          canPlay={isMyTurn && phase === 'play-hand' && !actionPending}
          onCardClick={handleCardClick}
        />
      </div>

      {/* 오버레이 */}
      <ChatPanel />
      <AnimationLayer />

      {showEvent && gameState.lastEvent !== 'none' && (
        <EventPopup event={gameState.lastEvent as 'ttadak' | 'bomb' | 'sseul' | 'ppuk' | 'jjok'} />
      )}

      {showGoStop && (
        <GoStopModal
          score={myScore}
          goCount={myPlayer.goCount}
          onGo={handleGo}
          onStop={handleStop}
        />
      )}

      {phase === 'game-over' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-panel rounded-2xl border border-white/10 p-6 max-w-sm w-full mx-4 animate-result-appear">
            <h2 className="text-2xl font-display font-bold text-center mb-4">
              {gameState.winner !== null ? (
                <span className={((gameState.winner - seatIndex + 3) % 3) === 0 ? 'text-gold' : 'text-action-danger'}>
                  {((gameState.winner - seatIndex + 3) % 3) === 0 ? '승리!' : `${rotatedPlayers[(gameState.winner - seatIndex + 3) % 3]?.name} 승리`}
                </span>
              ) : (
                <span className="text-text-secondary">무승부</span>
              )}
            </h2>

            {gameState.gameResult && (
              <div className="text-center mb-4">
                <span className="text-3xl font-display font-bold text-gold">
                  {gameState.gameResult.finalScore}
                </span>
                <span className="text-sm text-text-muted ml-1">점</span>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.push('/lobby')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                  bg-panel-light border border-white/10 text-text-secondary
                  hover:border-white/20 cursor-pointer"
              >
                로비로
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                  bg-panel-light border border-white/10 text-text-secondary
                  hover:border-white/20 cursor-pointer"
              >
                메인으로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
