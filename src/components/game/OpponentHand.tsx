'use client';

import HwatuCard from './HwatuCard';

interface OpponentHandProps {
  cardCount: number;
  name: string;
  goCount: number;
  id?: number;
}

export default function OpponentHand({ cardCount, name, goCount, id }: OpponentHandProps) {
  return (
    <div className="flex flex-col items-center gap-1" data-zone={id !== undefined ? `opponent-${id}` : undefined}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary font-bold">{name}</span>
        {goCount > 0 && (
          <span className="text-[10px] bg-hwatu-red/30 text-hwatu-red px-1.5 py-0.5 rounded font-bold">
            {goCount}고
          </span>
        )}
      </div>
      {/* 겹쳐진 카드 더미 (실제 고스톱처럼) */}
      <div className="relative" style={{ width: 36 + (cardCount - 1) * 8, height: 54 }}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: i * 8, top: 0, zIndex: i }}
          >
            <HwatuCard faceDown size="xs" />
          </div>
        ))}
      </div>
      <span className="text-[10px] text-text-muted">{cardCount}장</span>
    </div>
  );
}
