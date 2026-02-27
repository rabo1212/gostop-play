/**
 * 화투 카드 시각 정보 — SVG 렌더링용
 */
import { Month, CardType, RibbonType } from '@/engine/types';

export interface MonthVisual {
  bgColor: string;
  bgGradient: [string, string];
  plantIcon: string;     // 대표 식물/동물 이모지 (SVG path 대신 간략화)
  plantName: string;
  accentColor: string;
}

export const MONTH_VISUALS: Record<Month, MonthVisual> = {
  1:  { bgColor: '#2D5A27', bgGradient: ['#3A7033', '#1E4019'], plantIcon: '🌲', plantName: '松', accentColor: '#4CAF50' },
  2:  { bgColor: '#C2185B', bgGradient: ['#E91E63', '#880E4F'], plantIcon: '🌸', plantName: '梅', accentColor: '#F48FB1' },
  3:  { bgColor: '#F06292', bgGradient: ['#F8BBD0', '#E91E63'], plantIcon: '🌸', plantName: '桜', accentColor: '#FCE4EC' },
  4:  { bgColor: '#7B1FA2', bgGradient: ['#9C27B0', '#4A148C'], plantIcon: '🌿', plantName: '藤', accentColor: '#CE93D8' },
  5:  { bgColor: '#1565C0', bgGradient: ['#1E88E5', '#0D47A1'], plantIcon: '🌺', plantName: '蘭', accentColor: '#90CAF9' },
  6:  { bgColor: '#D32F2F', bgGradient: ['#EF5350', '#B71C1C'], plantIcon: '🌺', plantName: '牡丹', accentColor: '#EF9A9A' },
  7:  { bgColor: '#F57F17', bgGradient: ['#FDD835', '#F57F17'], plantIcon: '🌾', plantName: '萩', accentColor: '#FFF59D' },
  8:  { bgColor: '#1A237E', bgGradient: ['#283593', '#0D1642'], plantIcon: '🌕', plantName: '芒', accentColor: '#FFD54F' },
  9:  { bgColor: '#E65100', bgGradient: ['#FF9800', '#BF360C'], plantIcon: '🌼', plantName: '菊', accentColor: '#FFCC80' },
  10: { bgColor: '#D32F2F', bgGradient: ['#FF5722', '#C62828'], plantIcon: '🍁', plantName: '紅葉', accentColor: '#FF8A65' },
  11: { bgColor: '#33691E', bgGradient: ['#558B2F', '#1B5E20'], plantIcon: '🌳', plantName: '桐', accentColor: '#AED581' },
  12: { bgColor: '#37474F', bgGradient: ['#546E7A', '#263238'], plantIcon: '🌧', plantName: '柳', accentColor: '#90A4AE' },
};

export interface TypeBadge {
  text: string;
  bgColor: string;
  textColor: string;
}

export const TYPE_BADGES: Record<CardType, TypeBadge> = {
  gwang: { text: '光', bgColor: '#FFD700', textColor: '#1A1A1A' },
  yeol:  { text: '열', bgColor: '#4CAF50', textColor: '#FFFFFF' },
  tti:   { text: '띠', bgColor: '#2196F3', textColor: '#FFFFFF' },
  pi:    { text: '피', bgColor: '#666666', textColor: '#FFFFFF' },
};

export const RIBBON_COLORS: Record<RibbonType, string> = {
  hongdan:   '#CC0000',
  cheongdan: '#1A3C8F',
  chodan:    '#CC0000',
  none:      'transparent',
};

/** 카드별 고유 일러스트 아이콘 (메인 그림) */
export function getCardMainIcon(month: Month, type: CardType): string {
  const icons: Record<string, string> = {
    '1-gwang': '鶴',    // 학
    '1-tti': '松',      // 홍단 리본
    '2-yeol': '鶯',     // 꾀꼬리
    '2-tti': '梅',      // 홍단 리본
    '3-gwang': '幕',    // 커튼(화면)
    '3-tti': '桜',      // 홍단 리본
    '4-yeol': '鳥',     // 두견새
    '4-tti': '藤',      // 초단 리본
    '5-yeol': '橋',     // 팔교
    '5-tti': '蘭',      // 초단 리본
    '6-yeol': '蝶',     // 나비
    '6-tti': '丹',      // 청단 리본
    '7-yeol': '猪',     // 멧돼지
    '7-tti': '萩',      // 초단 리본
    '8-gwang': '月',    // 보름달
    '8-yeol': '雁',     // 기러기
    '9-yeol': '盃',     // 국화잔
    '9-tti': '菊',      // 청단 리본
    '10-yeol': '鹿',   // 사슴
    '10-tti': '楓',     // 청단 리본
    '11-gwang': '桐',   // 오동
    '12-gwang': '雨',   // 비 (비광)
    '12-yeol': '燕',    // 제비
    '12-tti': '柳',     // 버드나무 띠
  };
  return icons[`${month}-${type}`] || '';
}
