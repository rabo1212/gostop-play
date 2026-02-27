'use client';

import { CardId } from '@/engine/types';
import HwatuCard from './HwatuCard';

interface PlayerHandProps {
  hand: CardId[];
  selectedCard: CardId | null;
  canPlay: boolean;
  onCardClick: (cardId: CardId) => void;
}

export default function PlayerHand({ hand, selectedCard, canPlay, onCardClick }: PlayerHandProps) {
  return (
    <div className="flex justify-center overflow-x-auto no-scrollbar px-1">
      <div className="flex shrink-0" style={{ gap: -4 }}>
        {hand.map((cardId, i) => {
          const isSelected = cardId === selectedCard;
          return (
            <div
              key={cardId}
              style={{
                marginLeft: i === 0 ? 0 : -8,
                marginTop: isSelected ? -12 : 0,
                zIndex: isSelected ? 50 : i,
                transition: 'margin-top 0.15s ease',
              }}
            >
              <HwatuCard
                cardId={cardId}
                size="lg"
                selected={isSelected}
                interactive={canPlay}
                onClick={onCardClick}
                zone="hand-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
