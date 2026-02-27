'use client';

import { CardId, Month } from '@/engine/types';
import HwatuCard from './HwatuCard';

interface TableFieldProps {
  tableCards: Map<Month, CardId[]>;
  highlightedCards?: CardId[];
  matchOptions?: CardId[];
  onMatchSelect?: (cardId: CardId) => void;
}

export default function TableField({
  tableCards,
  highlightedCards = [],
  matchOptions = [],
  onMatchSelect,
}: TableFieldProps) {
  // 바닥의 모든 카드를 하나의 배열로 모음
  const allCards: CardId[] = [];
  tableCards.forEach(cards => {
    allCards.push(...cards);
  });

  if (allCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-text-muted text-xs">
        바닥에 카드가 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-1 px-1 max-w-[300px]" data-zone="table">
      {allCards.map(cardId => (
        <HwatuCard
          key={cardId}
          cardId={cardId}
          size="xs"
          highlighted={highlightedCards.includes(cardId) || matchOptions.includes(cardId)}
          interactive={matchOptions.includes(cardId)}
          onClick={matchOptions.includes(cardId) ? onMatchSelect : undefined}
          zone="table"
        />
      ))}
    </div>
  );
}
