/**
 * 고스톱 족보 (조합 점수) 정의
 */

export interface ComboDefinition {
  id: string;
  nameKo: string;
  category: 'gwang' | 'tti' | 'yeol' | 'pi';
  points: number;
  description: string;
}

/** 광 조합 (상호 배타적: 가장 높은 것만 인정) */
export const GWANG_COMBOS: ComboDefinition[] = [
  { id: 'ohgwang', nameKo: '오광', category: 'gwang', points: 15, description: '광 5장 모두 모음' },
  { id: 'sagwang', nameKo: '사광', category: 'gwang', points: 4, description: '비광 제외 광 4장' },
  { id: 'bi-sagwang', nameKo: '비사광', category: 'gwang', points: 4, description: '비광 포함 광 4장' },
  { id: 'samgwang', nameKo: '삼광', category: 'gwang', points: 3, description: '비광 제외 광 3장' },
  { id: 'bi-samgwang', nameKo: '비삼광', category: 'gwang', points: 2, description: '비광 포함 광 3장' },
];

/** 띠 조합 (여러 개 중복 가능) */
export const TTI_COMBOS: ComboDefinition[] = [
  { id: 'hongdan', nameKo: '홍단', category: 'tti', points: 3, description: '1, 2, 3월 홍단 띠 3장' },
  { id: 'cheongdan', nameKo: '청단', category: 'tti', points: 3, description: '6, 9, 10월 청단 띠 3장' },
  { id: 'chodan', nameKo: '초단', category: 'tti', points: 3, description: '4, 5, 7월 초단 띠 3장' },
];

/** 열끗 특수 조합 */
export const YEOL_COMBOS: ComboDefinition[] = [
  { id: 'godori', nameKo: '고도리', category: 'yeol', points: 5, description: '2, 4, 8월 열끗 3장 (꾀꼬리, 두견새, 기러기)' },
];
