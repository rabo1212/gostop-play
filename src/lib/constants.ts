/**
 * 화투 48장 카드 원본 데이터 + 상수
 */
import { Month, CardType, RibbonType } from '@/engine/types';

export interface CardData {
  month: Month;
  type: CardType;
  ribbonType: RibbonType;
  name: string;
  isDoublePi: boolean;
  isBiGwang: boolean;
}

/**
 * 48장 화투 카드 데이터
 * 배열 인덱스 = CardId (0~47)
 * 각 월 4장씩, 순서: 광/열끗 → 띠 → 피
 */
export const CARD_DATA: CardData[] = [
  // ===== 1월 (송학, 松) — 소나무와 학 =====
  { month: 1,  type: 'gwang', ribbonType: 'none',    name: '1월 송학 광',     isDoublePi: false, isBiGwang: false },
  { month: 1,  type: 'tti',   ribbonType: 'hongdan', name: '1월 송학 홍단',   isDoublePi: false, isBiGwang: false },
  { month: 1,  type: 'pi',    ribbonType: 'none',    name: '1월 송학 피',     isDoublePi: false, isBiGwang: false },
  { month: 1,  type: 'pi',    ribbonType: 'none',    name: '1월 송학 피',     isDoublePi: false, isBiGwang: false },

  // ===== 2월 (매화, 梅) — 매화와 꾀꼬리 =====
  { month: 2,  type: 'yeol',  ribbonType: 'none',    name: '2월 매화 열끗',   isDoublePi: false, isBiGwang: false },
  { month: 2,  type: 'tti',   ribbonType: 'hongdan', name: '2월 매화 홍단',   isDoublePi: false, isBiGwang: false },
  { month: 2,  type: 'pi',    ribbonType: 'none',    name: '2월 매화 피',     isDoublePi: false, isBiGwang: false },
  { month: 2,  type: 'pi',    ribbonType: 'none',    name: '2월 매화 피',     isDoublePi: false, isBiGwang: false },

  // ===== 3월 (벚꽃, 桜) — 벚꽃과 커튼 =====
  { month: 3,  type: 'gwang', ribbonType: 'none',    name: '3월 벚꽃 광',     isDoublePi: false, isBiGwang: false },
  { month: 3,  type: 'tti',   ribbonType: 'hongdan', name: '3월 벚꽃 홍단',   isDoublePi: false, isBiGwang: false },
  { month: 3,  type: 'pi',    ribbonType: 'none',    name: '3월 벚꽃 피',     isDoublePi: false, isBiGwang: false },
  { month: 3,  type: 'pi',    ribbonType: 'none',    name: '3월 벚꽃 피',     isDoublePi: false, isBiGwang: false },

  // ===== 4월 (등나무, 藤) — 등나무와 두견새 =====
  { month: 4,  type: 'yeol',  ribbonType: 'none',    name: '4월 등나무 열끗', isDoublePi: false, isBiGwang: false },
  { month: 4,  type: 'tti',   ribbonType: 'chodan',  name: '4월 등나무 초단', isDoublePi: false, isBiGwang: false },
  { month: 4,  type: 'pi',    ribbonType: 'none',    name: '4월 등나무 피',   isDoublePi: false, isBiGwang: false },
  { month: 4,  type: 'pi',    ribbonType: 'none',    name: '4월 등나무 피',   isDoublePi: false, isBiGwang: false },

  // ===== 5월 (난초, 蘭) — 난초와 다리 =====
  { month: 5,  type: 'yeol',  ribbonType: 'none',    name: '5월 난초 열끗',   isDoublePi: false, isBiGwang: false },
  { month: 5,  type: 'tti',   ribbonType: 'chodan',  name: '5월 난초 초단',   isDoublePi: false, isBiGwang: false },
  { month: 5,  type: 'pi',    ribbonType: 'none',    name: '5월 난초 피',     isDoublePi: false, isBiGwang: false },
  { month: 5,  type: 'pi',    ribbonType: 'none',    name: '5월 난초 피',     isDoublePi: false, isBiGwang: false },

  // ===== 6월 (모란, 牡丹) — 모란과 나비 =====
  { month: 6,  type: 'yeol',  ribbonType: 'none',    name: '6월 모란 열끗',   isDoublePi: false, isBiGwang: false },
  { month: 6,  type: 'tti',   ribbonType: 'cheongdan', name: '6월 모란 청단', isDoublePi: false, isBiGwang: false },
  { month: 6,  type: 'pi',    ribbonType: 'none',    name: '6월 모란 피',     isDoublePi: false, isBiGwang: false },
  { month: 6,  type: 'pi',    ribbonType: 'none',    name: '6월 모란 피',     isDoublePi: false, isBiGwang: false },

  // ===== 7월 (싸리, 萩) — 싸리와 멧돼지 =====
  { month: 7,  type: 'yeol',  ribbonType: 'none',    name: '7월 싸리 열끗',   isDoublePi: false, isBiGwang: false },
  { month: 7,  type: 'tti',   ribbonType: 'chodan',  name: '7월 싸리 초단',   isDoublePi: false, isBiGwang: false },
  { month: 7,  type: 'pi',    ribbonType: 'none',    name: '7월 싸리 피',     isDoublePi: false, isBiGwang: false },
  { month: 7,  type: 'pi',    ribbonType: 'none',    name: '7월 싸리 피',     isDoublePi: false, isBiGwang: false },

  // ===== 8월 (공산, 芒) — 억새와 달 =====
  { month: 8,  type: 'gwang', ribbonType: 'none',    name: '8월 공산 광',     isDoublePi: false, isBiGwang: false },
  { month: 8,  type: 'yeol',  ribbonType: 'none',    name: '8월 공산 열끗',   isDoublePi: false, isBiGwang: false },
  { month: 8,  type: 'pi',    ribbonType: 'none',    name: '8월 공산 피',     isDoublePi: false, isBiGwang: false },
  { month: 8,  type: 'pi',    ribbonType: 'none',    name: '8월 공산 피',     isDoublePi: false, isBiGwang: false },

  // ===== 9월 (국화, 菊) — 국화와 잔 =====
  { month: 9,  type: 'yeol',  ribbonType: 'none',    name: '9월 국화 열끗',   isDoublePi: false, isBiGwang: false },
  { month: 9,  type: 'tti',   ribbonType: 'cheongdan', name: '9월 국화 청단', isDoublePi: false, isBiGwang: false },
  { month: 9,  type: 'pi',    ribbonType: 'none',    name: '9월 국화 피',     isDoublePi: false, isBiGwang: false },
  { month: 9,  type: 'pi',    ribbonType: 'none',    name: '9월 국화 피',     isDoublePi: false, isBiGwang: false },

  // ===== 10월 (단풍, 紅葉) — 단풍과 사슴 =====
  { month: 10, type: 'yeol',  ribbonType: 'none',    name: '10월 단풍 열끗',  isDoublePi: false, isBiGwang: false },
  { month: 10, type: 'tti',   ribbonType: 'cheongdan', name: '10월 단풍 청단', isDoublePi: false, isBiGwang: false },
  { month: 10, type: 'pi',    ribbonType: 'none',    name: '10월 단풍 피',    isDoublePi: false, isBiGwang: false },
  { month: 10, type: 'pi',    ribbonType: 'none',    name: '10월 단풍 피',    isDoublePi: false, isBiGwang: false },

  // ===== 11월 (오동, 桐) — 오동나무 =====
  { month: 11, type: 'gwang', ribbonType: 'none',    name: '11월 오동 광',    isDoublePi: false, isBiGwang: false },
  { month: 11, type: 'pi',    ribbonType: 'none',    name: '11월 오동 피',    isDoublePi: false, isBiGwang: false },
  { month: 11, type: 'pi',    ribbonType: 'none',    name: '11월 오동 쌍피',  isDoublePi: true,  isBiGwang: false },
  { month: 11, type: 'pi',    ribbonType: 'none',    name: '11월 오동 피',    isDoublePi: false, isBiGwang: false },

  // ===== 12월 (비, 柳) — 버드나무와 비 =====
  { month: 12, type: 'gwang', ribbonType: 'none',    name: '12월 비 광',      isDoublePi: false, isBiGwang: true  },
  { month: 12, type: 'yeol',  ribbonType: 'none',    name: '12월 비 열끗',    isDoublePi: false, isBiGwang: false },
  { month: 12, type: 'tti',   ribbonType: 'none',    name: '12월 비 띠',      isDoublePi: false, isBiGwang: false },
  { month: 12, type: 'pi',    ribbonType: 'none',    name: '12월 비 쌍피',    isDoublePi: true,  isBiGwang: false },
];

/** 월별 식물 이름 */
export const MONTH_NAMES: Record<Month, string> = {
  1: '송학',
  2: '매화',
  3: '벚꽃',
  4: '등나무',
  5: '난초',
  6: '모란',
  7: '싸리',
  8: '공산',
  9: '국화',
  10: '단풍',
  11: '오동',
  12: '비',
};

/** 월별 영문 식물 */
export const MONTH_PLANTS: Record<Month, string> = {
  1: 'Pine',
  2: 'Plum',
  3: 'Cherry',
  4: 'Wisteria',
  5: 'Iris',
  6: 'Peony',
  7: 'Clover',
  8: 'Susuki',
  9: 'Chrysanthemum',
  10: 'Maple',
  11: 'Paulownia',
  12: 'Willow',
};

/** 카드 타입 한국어 */
export const TYPE_LABELS: Record<CardType, string> = {
  gwang: '광',
  yeol: '열끗',
  tti: '띠',
  pi: '피',
};

/** 3인 고스톱 최소 점수 */
export const MIN_SCORE_TO_STOP = 3;

/** 피 카운트 기준 (이 이상이면 점수) */
export const PI_THRESHOLD = 10;

/** 열끗 카운트 기준 */
export const YEOL_THRESHOLD = 5;

/** 띠 카운트 기준 (혼합) */
export const TTI_THRESHOLD = 5;

/** 3인 고스톱: 각 플레이어 7장, 바닥 6장 */
export const DEAL_HAND_COUNT = 7;
export const DEAL_TABLE_COUNT = 6;
export const PLAYER_COUNT = 3;
