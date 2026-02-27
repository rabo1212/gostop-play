/**
 * 고스톱 핵심 타입 정의
 */

/** 카드 인스턴스 고유 ID (0~47) */
export type CardId = number;

/** 월 (1~12) */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** 카드 유형 */
export type CardType = 'gwang' | 'yeol' | 'tti' | 'pi';

/** 띠 세부 유형 */
export type RibbonType = 'hongdan' | 'cheongdan' | 'chodan' | 'none';

/** 난이도 */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** 게임 단계 */
export type GamePhase =
  | 'idle'
  | 'dealing'
  | 'play-hand'
  | 'hand-match-select'
  | 'draw'
  | 'draw-match-select'
  | 'resolve-capture'
  | 'go-stop-decision'
  | 'game-over';

/** 특수 이벤트 */
export type SpecialEvent = 'ttadak' | 'bomb' | 'sseul' | 'ppuk' | 'jjok' | 'none';

/** 카드 정의 */
export interface Card {
  id: CardId;
  month: Month;
  type: CardType;
  ribbonType: RibbonType;
  name: string;
  isDoublePi: boolean;
  isBiGwang: boolean; // 12월 비광 여부
}

/** 턴 액션 기록 */
export interface TurnAction {
  playedCardId: CardId;
  handMatchTarget: CardId | null;
  drawnCardId: CardId | null;
  drawMatchTarget: CardId | null;
  capturedCards: CardId[];
  events: SpecialEvent[];
}

/** 플레이어의 먹은 카드 */
export interface CapturedCards {
  gwang: CardId[];
  yeol: CardId[];
  tti: CardId[];
  pi: CardId[];
}

/** 플레이어 상태 */
export interface PlayerState {
  id: number;
  name: string;
  hand: CardId[];
  captured: CapturedCards;
  goCount: number;
  sseulCount: number;
  isAI: boolean;
}

/** 족보 (조합 점수) */
export interface ScoringCombo {
  id: string;
  nameKo: string;
  points: number;
  cardIds: CardId[];
}

/** 벌칙 */
export interface Penalty {
  type: 'gwangbak' | 'pibak' | 'gobak' | 'dokbak';
  multiplier: number;
  description: string;
}

/** 점수 분석 결과 */
export interface ScoringResult {
  baseScore: number;
  combos: ScoringCombo[];
  gwangScore: number;
  ttiScore: number;
  yeolScore: number;
  piScore: number;
  goMultiplier: number;
  penalties: Penalty[];
  finalScore: number;
}

/** 전체 게임 상태 (불변 스냅샷) */
export interface GameState {
  gameId: string;
  phase: GamePhase;
  players: PlayerState[];
  tableCards: Map<Month, CardId[]>;
  drawPile: CardId[];
  turnIndex: number;
  turnCount: number;
  currentTurnAction: Partial<TurnAction> | null;
  pendingMatchOptions: CardId[];
  lastEvent: SpecialEvent;
  difficulty: Difficulty;
  winner: number | null;
  gameResult: ScoringResult | null;
  // 고/스톱 선택 중인 플레이어
  goStopPlayer: number | null;
  // 최근 먹은 카드 (애니메이션용)
  lastCaptured: CardId[];
}
