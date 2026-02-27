'use client';

import { useState, useEffect, useCallback } from 'react';
import { CardId } from '@/engine/types';
import { useGameStore } from '@/stores/useGameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { calculateScore } from '@/engine/scoring';
import { checkBombOptions } from '@/engine/match-resolver';
import { playCardPlace, playCardCapture, playEvent, playGo, playStop, playGameOver } from '@/lib/sound';
import { useSettingsStore } from '@/stores/useSettingsStore';

import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import TableField from './TableField';
import DrawPile from './DrawPile';
import CapturedCards from './CapturedCards';
import ScoreBoard from './ScoreBoard';
import EventPopup from './EventPopup';
import GoStopModal from './GoStopModal';
import GameOverModal from './GameOverModal';

interface GameTableProps {
  onBackToMenu: () => void;
  onNextRound?: () => void;
  roundLabel?: string;
}

export default function GameTable({ onBackToMenu, onNextRound, roundLabel }: GameTableProps) {
  const phase = useGameStore(s => s.phase);
  const players = useGameStore(s => s.players);
  const tableCards = useGameStore(s => s.tableCards);
  const drawPile = useGameStore(s => s.drawPile);
  const turnIndex = useGameStore(s => s.turnIndex);
  const pendingMatchOptions = useGameStore(s => s.pendingMatchOptions);
  const lastEvent = useGameStore(s => s.lastEvent);
  const winner = useGameStore(s => s.winner);
  const gameResult = useGameStore(s => s.gameResult);
  const goStopPlayer = useGameStore(s => s.goStopPlayer);
  const difficulty = useGameStore(s => s.difficulty);
  const _state = useGameStore(s => s._state);

  const playerPlayCard = useGameStore(s => s.playerPlayCard);
  const playerSelectMatch = useGameStore(s => s.playerSelectMatch);
  const playerDrawCard = useGameStore(s => s.playerDrawCard);
  const playerResolveCapture = useGameStore(s => s.playerResolveCapture);
  const playerDeclareGo = useGameStore(s => s.playerDeclareGo);
  const playerDeclareStop = useGameStore(s => s.playerDeclareStop);
  const playerDeclareBomb = useGameStore(s => s.playerDeclareBomb);
  const initGame = useGameStore(s => s.initGame);

  const soundEnabled = useSettingsStore(s => s.soundEnabled);

  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);
  const [showEvent, setShowEvent] = useState(false);

  // AI 자동 진행
  useGameLoop();

  // 턴/페이즈 변경 시 선택 초기화
  useEffect(() => {
    setSelectedCard(null);
  }, [turnIndex, phase]);

  const isMyTurn = turnIndex === 0;
  const myPlayer = players[0];

  // 이벤트 팝업
  useEffect(() => {
    if (lastEvent && lastEvent !== 'none') {
      setShowEvent(true);
      if (soundEnabled) playEvent();
      const timer = setTimeout(() => setShowEvent(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [lastEvent, soundEnabled]);

  // 게임 종료 사운드
  useEffect(() => {
    if (phase === 'game-over' && soundEnabled) {
      playGameOver();
    }
  }, [phase, soundEnabled]);

  // 플레이어 턴 자동 진행 (draw, resolve-capture)
  useEffect(() => {
    if (!isMyTurn) return;

    if (phase === 'draw') {
      const timer = setTimeout(() => {
        if (useGameStore.getState().phase !== 'draw') return;
        playerDrawCard();
      }, 300);
      return () => clearTimeout(timer);
    }

    if (phase === 'resolve-capture') {
      const timer = setTimeout(() => {
        if (useGameStore.getState().phase !== 'resolve-capture') return;
        playerResolveCapture();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phase, isMyTurn, playerDrawCard, playerResolveCapture]);

  // 카드 클릭 핸들러
  const handleCardClick = useCallback((cardId: CardId) => {
    if (!isMyTurn || phase !== 'play-hand') return;

    if (selectedCard === cardId) {
      playerPlayCard(cardId);
      setSelectedCard(null);
      if (soundEnabled) playCardPlace();
    } else {
      setSelectedCard(cardId);
    }
  }, [isMyTurn, phase, selectedCard, playerPlayCard, soundEnabled]);

  // 매칭 선택 핸들러
  const handleMatchSelect = useCallback((targetId: CardId) => {
    playerSelectMatch(targetId);
    if (soundEnabled) playCardCapture();
  }, [playerSelectMatch, soundEnabled]);

  // 고/스톱 핸들러
  const handleGo = useCallback(() => {
    playerDeclareGo();
    if (soundEnabled) playGo();
  }, [playerDeclareGo, soundEnabled]);

  const handleStop = useCallback(() => {
    playerDeclareStop();
    if (soundEnabled) playStop();
  }, [playerDeclareStop, soundEnabled]);

  // 폭탄 핸들러
  const bombOptions = isMyTurn && phase === 'play-hand' && _state
    ? checkBombOptions(myPlayer?.hand || [], tableCards)
    : [];

  if (!myPlayer) return null;

  const myScore = calculateScore(myPlayer.captured, myPlayer.goCount);
  const isMatchSelect = isMyTurn && (phase === 'hand-match-select' || phase === 'draw-match-select');

  return (
    <div className="table-bg fixed inset-0 flex flex-col overflow-hidden">

      {/* ===== 상단: AI 플레이어들 ===== */}
      <div className="flex justify-around items-start pt-2 px-3">
        {players.slice(1).map((ai) => (
          <div key={ai.id} className="flex flex-col items-center gap-1">
            <OpponentHand
              cardCount={ai.hand.length}
              name={ai.name}
              goCount={ai.goCount}
            />
            <CapturedCards captured={ai.captured} compact />
          </div>
        ))}
      </div>

      {/* ===== 중앙: 게임판 (바닥 카드 + 뽑을 패) ===== */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-3">
        {/* 턴 표시 */}
        <div className="flex items-center gap-2 text-xs">
          {roundLabel && (
            <span className="px-2 py-0.5 rounded bg-white/5 text-text-muted font-bold">
              {roundLabel}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded font-bold ${isMyTurn ? 'bg-gold/20 text-gold' : 'bg-white/10 text-text-muted'}`}>
            {isMyTurn ? '내 차례' : `${players[turnIndex]?.name} 차례`}
          </span>
          <span className="text-text-muted text-[10px]">턴 {Math.ceil((useGameStore.getState().turnCount || 1) / 3)}</span>
        </div>

        {/* 매칭 선택 안내 */}
        {isMatchSelect && (
          <div className="text-xs text-gold animate-pulse-gold px-3 py-1 rounded bg-gold/10 border border-gold/20">
            매칭할 카드를 선택하세요
          </div>
        )}

        {/* 바닥 카드 + 뽑을 패 더미 (가로 배치) */}
        <div className="flex items-center gap-4">
          <TableField
            tableCards={tableCards}
            matchOptions={isMatchSelect ? pendingMatchOptions : []}
            onMatchSelect={isMatchSelect ? handleMatchSelect : undefined}
          />
          <DrawPile remaining={drawPile.length} />
        </div>
      </div>

      {/* ===== 하단: 내 영역 ===== */}
      <div className="pb-2 px-2 space-y-1.5">
        {/* 점수판 + 먹은 패 */}
        <div className="flex items-start gap-2">
          <ScoreBoard score={myScore} goCount={myPlayer.goCount} />
          <div className="flex-1 overflow-x-auto no-scrollbar">
            <CapturedCards captured={myPlayer.captured} compact />
          </div>
        </div>

        {/* 폭탄 버튼 */}
        {bombOptions.length > 0 && (
          <div className="flex justify-center gap-2">
            {bombOptions.map(month => (
              <button
                key={month}
                className="action-btn action-btn-go px-3 py-1.5 text-xs"
                onClick={() => playerDeclareBomb(month)}
              >
                {month}월 폭탄!
              </button>
            ))}
          </div>
        )}

        {/* 손패 */}
        <PlayerHand
          hand={myPlayer.hand}
          selectedCard={selectedCard}
          canPlay={isMyTurn && phase === 'play-hand'}
          onCardClick={handleCardClick}
        />

        {/* 안내 텍스트 */}
        {isMyTurn && phase === 'play-hand' && (
          <p className="text-center text-[10px] text-text-muted">
            {selectedCard !== null ? '다시 터치하면 카드를 냅니다' : '카드를 터치해 선택하세요'}
          </p>
        )}
      </div>

      {/* ===== 오버레이 ===== */}

      {/* 이벤트 팝업 */}
      {showEvent && lastEvent !== 'none' && (
        <EventPopup event={lastEvent} />
      )}

      {/* 고/스톱 모달 */}
      {phase === 'go-stop-decision' && goStopPlayer === 0 && (
        <GoStopModal
          score={myScore}
          goCount={myPlayer.goCount}
          onGo={handleGo}
          onStop={handleStop}
        />
      )}

      {/* 게임 종료 */}
      {phase === 'game-over' && (
        <GameOverModal
          winner={winner}
          players={players}
          gameResult={gameResult}
          onRestart={() => initGame(difficulty)}
          onBackToMenu={onBackToMenu}
          onNextRound={onNextRound}
          roundLabel={roundLabel}
        />
      )}
    </div>
  );
}
