'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CardId } from '@/engine/types';
import { useGameStore } from '@/stores/useGameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { calculateScore } from '@/engine/scoring';
import { checkBombOptions } from '@/engine/match-resolver';
import { playCardPlace, playCardCapture, playEvent, playGo, playStop, playGameOver } from '@/lib/sound';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAnimationStore, animId } from '@/stores/useAnimationStore';
import { captureCardPosition, captureZoneCenter, prefersReducedMotion } from '@/hooks/useCardPositions';

import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import TableField from './TableField';
import DrawPile from './DrawPile';
import CapturedCards from './CapturedCards';
import ScoreBoard from './ScoreBoard';
import EventPopup from './EventPopup';
import GoStopModal from './GoStopModal';
import GameOverModal from './GameOverModal';
import AnimationLayer from './AnimationLayer';

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
  const lastCaptured = useGameStore(s => s.lastCaptured);

  const playerPlayCard = useGameStore(s => s.playerPlayCard);
  const playerSelectMatch = useGameStore(s => s.playerSelectMatch);
  const playerDrawCard = useGameStore(s => s.playerDrawCard);
  const playerResolveCapture = useGameStore(s => s.playerResolveCapture);
  const playerDeclareGo = useGameStore(s => s.playerDeclareGo);
  const playerDeclareStop = useGameStore(s => s.playerDeclareStop);
  const playerDeclareBomb = useGameStore(s => s.playerDeclareBomb);
  const initGame = useGameStore(s => s.initGame);

  const soundEnabled = useSettingsStore(s => s.soundEnabled);
  const enqueue = useAnimationStore(s => s.enqueue);
  const enqueueBatch = useAnimationStore(s => s.enqueueBatch);

  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);
  const [showEvent, setShowEvent] = useState(false);

  // 캡처 애니메이션용 이전 상태 추적
  const prevPhaseRef = useRef(phase);

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

  // ====== 먹기 애니메이션 (resolve-capture 진입 시) ======
  useEffect(() => {
    if (phase === 'resolve-capture' && prevPhaseRef.current !== 'resolve-capture') {
      if (!prefersReducedMotion() && lastCaptured.length > 0) {
        const currentTurn = useGameStore.getState().turnIndex;
        const capturedZone = currentTurn === 0 ? 'captured-0' : `captured-${currentTurn}`;
        const toRect = captureZoneCenter(capturedZone);

        const anims = lastCaptured
          .map((cardId, i) => {
            const fromRect = captureCardPosition(cardId, 'table');
            if (!fromRect || !toRect) return null;
            return {
              id: animId('cap'),
              cardId,
              fromRect,
              toRect: { left: toRect.left, top: toRect.top, width: 36, height: 54 },
              type: 'capture' as const,
              duration: 300,
              delay: i * 50,
            };
          })
          .filter((a): a is NonNullable<typeof a> => a !== null);

        if (anims.length > 0) {
          enqueueBatch(anims);
        }
      }
    }
    prevPhaseRef.current = phase;
  }, [phase, lastCaptured, enqueueBatch]);

  // 플레이어 턴 자동 진행 (draw, resolve-capture)
  useEffect(() => {
    if (!isMyTurn) return;

    if (phase === 'draw') {
      const timer = setTimeout(() => {
        if (useGameStore.getState().phase !== 'draw') return;

        // 뽑기 애니메이션
        if (!prefersReducedMotion()) {
          const fromRect = captureZoneCenter('draw');
          if (fromRect) {
            const drawFromRect = { left: fromRect.left, top: fromRect.top, width: 48, height: 72 };
            playerDrawCard();
            requestAnimationFrame(() => {
              const state = useGameStore.getState();
              const drawnCardId = state.currentTurnAction?.drawnCardId;
              if (drawnCardId !== undefined && drawnCardId !== null) {
                const toRect = captureCardPosition(drawnCardId, 'table') || captureZoneCenter('table');
                if (toRect) {
                  enqueue({
                    id: animId('draw'),
                    cardId: drawnCardId,
                    fromRect: drawFromRect,
                    toRect,
                    type: 'draw',
                    faceDown: true,
                    flipMidway: true,
                    duration: 300,
                    delay: 0,
                  });
                }
              }
            });
            return;
          }
        }
        playerDrawCard();
      }, 350);
      return () => clearTimeout(timer);
    }

    if (phase === 'resolve-capture') {
      const timer = setTimeout(() => {
        if (useGameStore.getState().phase !== 'resolve-capture') return;
        if (soundEnabled) playCardCapture();
        playerResolveCapture();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, isMyTurn, playerDrawCard, playerResolveCapture, enqueue, soundEnabled]);

  // 카드 클릭 핸들러 (1탭으로 바로 내기)
  const handleCardClick = useCallback((cardId: CardId) => {
    if (!isMyTurn || phase !== 'play-hand') return;

    // 출발 위치 캡처
    const fromRect = captureCardPosition(cardId, 'hand-0');

    // 상태 변경
    playerPlayCard(cardId);
    setSelectedCard(null);
    if (soundEnabled) playCardPlace();

    // 애니메이션 등록
    if (fromRect && !prefersReducedMotion()) {
      requestAnimationFrame(() => {
        const toRect = captureCardPosition(cardId, 'table') || captureZoneCenter('table');
        if (toRect) {
          enqueue({
            id: animId('play'),
            cardId,
            fromRect,
            toRect,
            type: 'play',
            duration: 250,
            delay: 0,
          });
        }
      });
    }
  }, [isMyTurn, phase, playerPlayCard, soundEnabled, enqueue]);

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
    <div className="table-bg fixed inset-0 flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">

      {/* ===== 상단: 상대 플레이어들 (압축) ===== */}
      <div className="flex justify-around items-start pt-1 px-2 shrink-0">
        {players.slice(1).map((ai) => (
          <div key={ai.id} className="flex flex-col items-center">
            <OpponentHand
              cardCount={ai.hand.length}
              name={ai.name}
              goCount={ai.goCount}
              id={ai.id}
            />
            <CapturedCards captured={ai.captured} compact playerId={ai.id} />
          </div>
        ))}
      </div>

      {/* ===== 중앙: 바닥패 + 뽑을패 ===== */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1 px-2 min-h-0">
        {/* 턴 표시 */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          {roundLabel && (
            <span className="px-2 py-0.5 rounded bg-white/5 text-text-muted font-bold text-[10px]">
              {roundLabel}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${isMyTurn ? 'bg-gold/20 text-gold' : 'bg-white/10 text-text-muted'}`}>
            {isMyTurn ? '내 차례' : `${players[turnIndex]?.name} 차례`}
          </span>
        </div>

        {/* 매칭 선택 안내 */}
        {isMatchSelect && (
          <div className="text-[11px] text-gold animate-pulse-gold px-2 py-0.5 rounded bg-gold/10 border border-gold/20 shrink-0">
            매칭할 카드를 선택하세요
          </div>
        )}

        {/* 바닥 카드 + 뽑을 패 더미 */}
        <div className="flex items-center gap-3">
          <TableField
            tableCards={tableCards}
            matchOptions={isMatchSelect ? pendingMatchOptions : []}
            onMatchSelect={isMatchSelect ? handleMatchSelect : undefined}
          />
          <DrawPile remaining={drawPile.length} />
        </div>
      </div>

      {/* ===== 하단: 내 영역 ===== */}
      <div className="pb-2 px-2 shrink-0" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {/* 점수 + 먹은 패 (가로 한 줄) */}
        <div className="flex items-center gap-1.5 mb-1">
          <ScoreBoard score={myScore} goCount={myPlayer.goCount} />
          <div className="flex-1 overflow-x-auto no-scrollbar">
            <CapturedCards captured={myPlayer.captured} playerId={0} />
          </div>
        </div>

        {/* 폭탄 버튼 */}
        {bombOptions.length > 0 && (
          <div className="flex justify-center gap-2 mb-1">
            {bombOptions.map(month => (
              <button
                key={month}
                className="action-btn action-btn-go px-3 py-1 text-[11px]"
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
      </div>

      {/* ===== 오버레이 ===== */}

      {/* 애니메이션 레이어 */}
      <AnimationLayer />

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
