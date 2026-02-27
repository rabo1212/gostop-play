/**
 * 온라인 대국 전용 타입
 */
import type { CapturedCards, ScoringResult } from '@/engine/types';

/** 게임 액션 (클라이언트 → 서버) */
export type GoStopGameAction =
  | { type: 'play-hand-card'; cardId: number }
  | { type: 'select-match-target'; targetId: number }
  | { type: 'declare-go' }
  | { type: 'declare-stop' }
  | { type: 'declare-bomb'; month: number }
  | { type: 'timeout' };

/** 플레이어별 게임 상태 DTO (서버 → 클라이언트) */
export interface GameStateDTO {
  gameId: string;
  phase: string;
  players: {
    id: number;
    name: string;
    handCount: number;
    hand: number[];         // 본인만 실제 카드, 상대는 빈 배열
    captured: CapturedCards;
    goCount: number;
    sseulCount: number;
    isAI: boolean;
  }[];
  tableCards: Record<string, number[]>; // Month를 string key로
  drawPileCount: number;
  turnIndex: number;
  turnCount: number;
  pendingMatchOptions: number[];
  lastEvent: string;
  difficulty: string;
  winner: number | null;
  gameResult: ScoringResult | null;
  goStopPlayer: number | null;
  lastCaptured: number[];
  myBombOptions: number[];
  turnDeadlineMs: number | null;
}

/** 방 참가자 정보 */
export interface RoomPlayer {
  id: string;
  nickname: string;
  seatIndex: number;
  isAI: boolean;
  isConnected: boolean;
}

/** 방 상태 */
export type RoomStatus = 'waiting' | 'playing' | 'finished';

/** 방 정보 */
export interface RoomInfo {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  difficulty: string;
  roundCount: number;
  players: RoomPlayer[];
  createdAt: string;
}

/** 정형문 채팅 프리셋 */
export const PRESET_MESSAGES = [
  '좋은 수네요',
  '잘하셨습니다',
  '감사합니다',
  '실수했다...',
  '빨리 해주세요',
  '잠깐만요',
  '축하합니다!',
  '다시 한 판!',
  '고!',
  '스톱!',
] as const;

/** 채팅 메시지 (Realtime broadcast 전용) */
export interface ChatMessage {
  seatIndex: number;
  nickname: string;
  messageIndex: number;
  timestamp: number;
}

/** 방 목록 아이템 */
export interface RoomListItem {
  id: string;
  code: string;
  hostNickname: string;
  playerCount: number;
  difficulty: string;
  roundCount: number;
  createdAt: string;
}
