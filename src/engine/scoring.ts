/**
 * 고스톱 점수 계산 엔진
 */
import { CardId, CapturedCards, ScoringResult, ScoringCombo, Penalty, PlayerState } from './types';
import { getCard, countPiValue, isBiGwang, isGodoriTarget } from './cards';
import { PI_THRESHOLD, YEOL_THRESHOLD, TTI_THRESHOLD } from '@/lib/constants';

/**
 * 플레이어의 먹은 카드로 점수 계산
 */
export function calculateScore(captured: CapturedCards, goCount: number = 0): ScoringResult {
  const combos: ScoringCombo[] = [];

  const gwangScore = calcGwangScore(captured.gwang, combos);
  const ttiScore = calcTtiScore(captured.tti, combos);
  const yeolScore = calcYeolScore(captured.yeol, combos);
  const piScore = calcPiScore(captured.pi, combos);

  const baseScore = gwangScore + ttiScore + yeolScore + piScore;
  const goMultiplier = goCount > 0 ? Math.pow(2, goCount) : 1;
  const finalScore = baseScore * goMultiplier;

  return {
    baseScore,
    combos,
    gwangScore,
    ttiScore,
    yeolScore,
    piScore,
    goMultiplier,
    penalties: [],
    finalScore,
  };
}

/**
 * 벌칙 계산 (승자와 패자들 비교)
 */
export function calculatePenalties(
  winner: PlayerState,
  losers: PlayerState[],
): Penalty[] {
  const penalties: Penalty[] = [];

  for (const loser of losers) {
    // 광박: 패자가 광 0장
    if (winner.captured.gwang.length > 0 && loser.captured.gwang.length === 0) {
      penalties.push({
        type: 'gwangbak',
        multiplier: 2,
        description: `${loser.name}: 광박 (광 0장)`,
      });
    }

    // 피박: 패자의 피 카운트가 7장 이하 (기본 기준 아래)
    const loserPiCount = countPiValue(loser.captured.pi);
    if (loserPiCount < 7) {
      // 피박은 승자가 피 점수를 획득했을 때만
      const winnerPiCount = countPiValue(winner.captured.pi);
      if (winnerPiCount >= PI_THRESHOLD) {
        penalties.push({
          type: 'pibak',
          multiplier: 2,
          description: `${loser.name}: 피박 (피 ${loserPiCount}장)`,
        });
      }
    }

    // 고박: 패자가 고를 선언했는데 진 경우
    if (loser.goCount > 0) {
      penalties.push({
        type: 'gobak',
        multiplier: 2,
        description: `${loser.name}: 고박 (고 ${loser.goCount}회 후 패배)`,
      });
    }
  }

  return penalties;
}

/**
 * 최종 정산: 특정 패자 1명에 대한 지불 금액 계산
 * @param winnerScore 승자 점수
 * @param penaltiesForLoser 해당 패자의 벌칙만 (calculatePenalties에서 패자별 필터링 필요)
 */
export function calculateSettlement(
  winnerScore: ScoringResult,
  penaltiesForLoser: Penalty[],
): number {
  let multiplier = winnerScore.goMultiplier;
  for (const p of penaltiesForLoser) {
    multiplier *= p.multiplier;
  }
  return winnerScore.baseScore * multiplier;
}

// =================== 내부 함수 ===================

/** 광 점수 (상호 배타: 최고만) */
function calcGwangScore(gwangCards: CardId[], combos: ScoringCombo[]): number {
  const count = gwangCards.length;
  if (count < 3) return 0;

  const hasBi = gwangCards.some(id => isBiGwang(id));

  if (count === 5) {
    combos.push({ id: 'ohgwang', nameKo: '오광', points: 15, cardIds: gwangCards });
    return 15;
  }

  if (count === 4) {
    if (hasBi) {
      combos.push({ id: 'bi-sagwang', nameKo: '비사광', points: 4, cardIds: gwangCards });
    } else {
      combos.push({ id: 'sagwang', nameKo: '사광', points: 4, cardIds: gwangCards });
    }
    return 4;
  }

  if (count === 3) {
    if (hasBi) {
      combos.push({ id: 'bi-samgwang', nameKo: '비삼광', points: 2, cardIds: gwangCards });
      return 2;
    } else {
      combos.push({ id: 'samgwang', nameKo: '삼광', points: 3, cardIds: gwangCards });
      return 3;
    }
  }

  return 0;
}

/** 띠 점수 (세트 + 추가장) */
function calcTtiScore(ttiCards: CardId[], combos: ScoringCombo[]): number {
  let score = 0;

  // 홍단: 1, 2, 3월 띠
  const hongdan = ttiCards.filter(id => {
    const card = getCard(id);
    return card.ribbonType === 'hongdan';
  });
  if (hongdan.length >= 3) {
    combos.push({ id: 'hongdan', nameKo: '홍단', points: 3, cardIds: hongdan.slice(0, 3) });
    score += 3;
  }

  // 청단: 6, 9, 10월 띠
  const cheongdan = ttiCards.filter(id => {
    const card = getCard(id);
    return card.ribbonType === 'cheongdan';
  });
  if (cheongdan.length >= 3) {
    combos.push({ id: 'cheongdan', nameKo: '청단', points: 3, cardIds: cheongdan.slice(0, 3) });
    score += 3;
  }

  // 초단: 4, 5, 7월 띠
  const chodan = ttiCards.filter(id => {
    const card = getCard(id);
    return card.ribbonType === 'chodan';
  });
  if (chodan.length >= 3) {
    combos.push({ id: 'chodan', nameKo: '초단', points: 3, cardIds: chodan.slice(0, 3) });
    score += 3;
  }

  // 띠 5장 이상 추가 점수
  if (ttiCards.length >= TTI_THRESHOLD) {
    const extraPoints = ttiCards.length - TTI_THRESHOLD + 1;
    combos.push({
      id: 'tti-extra',
      nameKo: `띠 ${ttiCards.length}장`,
      points: extraPoints,
      cardIds: ttiCards,
    });
    score += extraPoints;
  }

  return score;
}

/** 열끗 점수 (고도리 + 추가장) */
function calcYeolScore(yeolCards: CardId[], combos: ScoringCombo[]): number {
  let score = 0;

  // 고도리: 2, 4, 8월 열끗
  const godori = yeolCards.filter(id => isGodoriTarget(id));
  if (godori.length >= 3) {
    combos.push({ id: 'godori', nameKo: '고도리', points: 5, cardIds: godori.slice(0, 3) });
    score += 5;
  }

  // 열끗 5장 이상 추가 점수
  if (yeolCards.length >= YEOL_THRESHOLD) {
    const extraPoints = yeolCards.length - YEOL_THRESHOLD + 1;
    combos.push({
      id: 'yeol-extra',
      nameKo: `열끗 ${yeolCards.length}장`,
      points: extraPoints,
      cardIds: yeolCards,
    });
    score += extraPoints;
  }

  return score;
}

/** 피 점수 */
function calcPiScore(piCards: CardId[], combos: ScoringCombo[]): number {
  const piCount = countPiValue(piCards);

  if (piCount >= PI_THRESHOLD) {
    const points = piCount - PI_THRESHOLD + 1;
    combos.push({
      id: 'pi-count',
      nameKo: `피 ${piCount}장`,
      points,
      cardIds: piCards,
    });
    return points;
  }

  return 0;
}
