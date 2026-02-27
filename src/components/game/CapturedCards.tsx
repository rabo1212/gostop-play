'use client';

import { CapturedCards as CapturedType, CardId } from '@/engine/types';
import { countPiValue } from '@/engine/cards';
import HwatuCard from './HwatuCard';

interface CapturedCardsProps {
  captured: CapturedType;
  compact?: boolean;
  playerId?: number;
}

/**
 * 먹은 패 표시 — 가로 한 줄로 카테고리별 중첩 배치
 * [광광] [멍멍멍] [띠띠띠] [피피피피피]
 */
export default function CapturedCards({ captured, compact = false, playerId }: CapturedCardsProps) {
  const piCount = countPiValue(captured.pi);
  const isEmpty = captured.gwang.length === 0 && captured.yeol.length === 0 &&
    captured.tti.length === 0 && captured.pi.length === 0;

  if (isEmpty) {
    return (
      <div className="text-[10px] text-text-muted" data-zone={playerId !== undefined ? `captured-${playerId}` : undefined}>
        아직 없음
      </div>
    );
  }

  // compact: 상대방용 (더 작은 카드, 더 많은 중첩)
  const cardSize = compact ? 'xs' as const : 'xs' as const;
  const overlap = compact ? 14 : 18; // 카드 간 겹침 오프셋 (px)

  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
      data-zone={playerId !== undefined ? `captured-${playerId}` : undefined}
    >
      {captured.gwang.length > 0 && (
        <CardGroup label="광" count={captured.gwang.length} cards={captured.gwang} size={cardSize} overlap={overlap} color="text-gold" />
      )}
      {captured.yeol.length > 0 && (
        <CardGroup label="열" count={captured.yeol.length} cards={captured.yeol} size={cardSize} overlap={overlap} color="text-action-success" />
      )}
      {captured.tti.length > 0 && (
        <CardGroup label="띠" count={captured.tti.length} cards={captured.tti} size={cardSize} overlap={overlap} color="text-action-blue" />
      )}
      {captured.pi.length > 0 && (
        <CardGroup label="피" count={piCount} cards={captured.pi} size={cardSize} overlap={Math.max(overlap - 4, 10)} color="text-text-muted" />
      )}
    </div>
  );
}

function CardGroup({
  label,
  count,
  cards,
  size,
  overlap,
  color,
}: {
  label: string;
  count: number;
  cards: CardId[];
  size: 'xs' | 'sm';
  overlap: number;
  color: string;
}) {
  const cardW = size === 'xs' ? 36 : 48;
  const totalWidth = cardW + (cards.length - 1) * overlap;

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <span className={`text-[9px] font-bold ${color} leading-none`}>
        {label}{count}
      </span>
      <div className="relative" style={{ width: totalWidth, height: size === 'xs' ? 54 : 72 }}>
        {cards.map((cardId, i) => (
          <div
            key={cardId}
            className="absolute top-0"
            style={{ left: i * overlap, zIndex: i }}
          >
            <HwatuCard cardId={cardId} size={size} />
          </div>
        ))}
      </div>
    </div>
  );
}
