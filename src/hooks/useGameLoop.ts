'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { useAnimationStore, animId } from '@/stores/useAnimationStore';
import { captureZoneCenter, captureCardPosition, prefersReducedMotion } from '@/hooks/useCardPositions';
import {
  aiChooseHandCard, aiSelectMatch as aiSelect,
  aiGoStopDecision, aiShouldBomb,
} from '@/ai/ai-player';

/**
 * AI 턴 자동 진행 훅
 */
export function useGameLoop() {
  const phase = useGameStore(s => s.phase);
  const turnIndex = useGameStore(s => s.turnIndex);
  const goStopPlayer = useGameStore(s => s.goStopPlayer);
  const pendingMatchOptions = useGameStore(s => s.pendingMatchOptions);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (phase === 'idle' || phase === 'game-over') return;

    const isAI = turnIndex !== 0;

    // AI의 고/스톱 결정
    if (phase === 'go-stop-decision' && goStopPlayer !== null && goStopPlayer !== 0) {
      timerRef.current = setTimeout(() => {
        const freshState = useGameStore.getState()._state;
        if (!freshState || freshState.phase !== 'go-stop-decision') return;
        const decision = aiGoStopDecision(freshState, goStopPlayer);
        if (decision === 'go') {
          useGameStore.getState().aiDeclareGo();
        } else {
          useGameStore.getState().aiDeclareStop();
        }
      }, 1200 + Math.random() * 400);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    if (!isAI) return;

    switch (phase) {
      case 'play-hand': {
        timerRef.current = setTimeout(() => {
          const freshState = useGameStore.getState()._state;
          if (!freshState || freshState.phase !== 'play-hand') return;
          const idx = freshState.turnIndex;
          if (freshState.players[idx].hand.length === 0) return;

          // 폭탄 체크
          const bombMonth = aiShouldBomb(freshState, idx);
          if (bombMonth !== null) {
            useGameStore.getState().aiBomb(bombMonth);
            return;
          }

          // AI 카드 출발 위치 캡처
          const fromRect = captureZoneCenter(`opponent-${idx}`);
          const cardId = aiChooseHandCard(freshState, idx);
          useGameStore.getState().aiPlayCard(cardId);

          // 애니메이션 등록
          if (fromRect && !prefersReducedMotion()) {
            requestAnimationFrame(() => {
              const toRect = captureCardPosition(cardId, 'table') || captureZoneCenter('table');
              if (toRect) {
                useAnimationStore.getState().enqueue({
                  id: animId('ai-play'),
                  cardId,
                  fromRect: { left: fromRect.left, top: fromRect.top, width: 36, height: 54 },
                  toRect,
                  type: 'play',
                  duration: 400,
                  delay: 0,
                });
              }
            });
          }
        }, 1200 + Math.random() * 600);
        break;
      }

      case 'hand-match-select':
      case 'draw-match-select': {
        timerRef.current = setTimeout(() => {
          const freshState = useGameStore.getState()._state;
          if (!freshState) return;
          if (freshState.phase !== 'hand-match-select' && freshState.phase !== 'draw-match-select') return;
          const opts = freshState.pendingMatchOptions;
          const target = aiSelect(freshState, freshState.turnIndex, opts);
          useGameStore.getState().aiSelectMatch(target);
        }, 700 + Math.random() * 300);
        break;
      }

      case 'draw': {
        timerRef.current = setTimeout(() => {
          const freshState = useGameStore.getState()._state;
          if (!freshState || freshState.phase !== 'draw') return;

          const fromRect = captureZoneCenter('draw');
          useGameStore.getState().aiDrawCard();

          // 뽑기 애니메이션
          if (fromRect && !prefersReducedMotion()) {
            requestAnimationFrame(() => {
              const state = useGameStore.getState();
              const drawnCardId = state.currentTurnAction?.drawnCardId;
              if (drawnCardId !== undefined && drawnCardId !== null) {
                const toRect = captureCardPosition(drawnCardId, 'table') || captureZoneCenter('table');
                if (toRect) {
                  useAnimationStore.getState().enqueue({
                    id: animId('ai-draw'),
                    cardId: drawnCardId,
                    fromRect: { left: fromRect.left, top: fromRect.top, width: 48, height: 72 },
                    toRect,
                    type: 'draw',
                    faceDown: true,
                    flipMidway: true,
                    duration: 400,
                    delay: 0,
                  });
                }
              }
            });
          }
        }, 800 + Math.random() * 300);
        break;
      }

      case 'resolve-capture': {
        timerRef.current = setTimeout(() => {
          const freshState = useGameStore.getState()._state;
          if (!freshState || freshState.phase !== 'resolve-capture') return;
          useGameStore.getState().aiResolveCapture();
        }, 900);
        break;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, turnIndex, goStopPlayer, pendingMatchOptions]);
}
