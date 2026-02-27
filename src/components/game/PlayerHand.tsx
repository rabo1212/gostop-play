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
  // 카드 수에 따라 중첩량 조절 — 많을수록 더 겹침
  const cardWidth = 60; // md size
  const maxHandWidth = typeof window !== 'undefined' ? window.innerWidth - 24 : 360;
  const neededWidth = hand.length * cardWidth;
  const overlap = hand.length <= 1
    ? 0
    : Math.min(Math.max((neededWidth - maxHandWidth) / (hand.length - 1), 0), cardWidth * 0.55);

  const totalWidth = hand.length <= 1
    ? cardWidth
    : cardWidth * hand.length - overlap * (hand.length - 1);

  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: totalWidth, height: 90 }}>
        {hand.map((cardId, i) => {
          const isSelected = cardId === selectedCard;
          return (
            <div
              key={cardId}
              className="absolute top-0"
              style={{
                left: i * (cardWidth - overlap),
                marginTop: isSelected ? -8 : 0,
                zIndex: isSelected ? 50 : i,
                transition: 'margin-top 0.15s ease',
              }}
            >
              <HwatuCard
                cardId={cardId}
                size="md"
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
