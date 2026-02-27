'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import {
  aiChooseHandCard, aiSelectMatch as aiSelect,
  aiGoStopDecision, aiShouldBomb,
} from '@/ai/ai-player';

/**
 * AI 턴 자동 진행 훅
 * 게임 상태 변화를 감지하여 AI 행동을 자동 실행
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
        // 최신 상태를 읽어서 stale closure 방지
        const freshState = useGameStore.getState()._state;
        if (!freshState || freshState.phase !== 'go-stop-decision') return;
        const decision = aiGoStopDecision(freshState, goStopPlayer);
        if (decision === 'go') {
          useGameStore.getState().aiDeclareGo();
        } else {
          useGameStore.getState().aiDeclareStop();
        }
      }, 800);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    if (!isAI) return; // 플레이어 턴이면 대기

    switch (phase) {
      case 'play-hand': {
        timerRef.current = setTimeout(() => {
          const freshState = useGameStore.getState()._state;
          if (!freshState || freshState.phase !== 'play-hand') return;
          const idx = freshState.turnIndex;
          // 손패가 비었으면 스킵 (폭탄으로 조기 소진 대비)
          if (freshState.players[idx].hand.length === 0) return;
          // 폭탄 체크
          const bombMonth = aiShouldBomb(freshState, idx);
          if (bombMonth !== null) {
            useGameStore.getState().aiBomb(bombMonth);
            return;
          }
          // 카드 내기
          const cardId = aiChooseHandCard(freshState, idx);
          useGameStore.getState().aiPlayCard(cardId);
        }, 600 + Math.random() * 400);
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
        }, 400);
        break;
      }

      case 'draw': {
        timerRef.current = setTimeout(() => {
          const freshState = useGameStore.getState()._state;
          if (!freshState || freshState.phase !== 'draw') return;
          useGameStore.getState().aiDrawCard();
        }, 400);
        break;
      }

      case 'resolve-capture': {
        timerRef.current = setTimeout(() => {
          const freshState = useGameStore.getState()._state;
          if (!freshState || freshState.phase !== 'resolve-capture') return;
          useGameStore.getState().aiResolveCapture();
        }, 300);
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
