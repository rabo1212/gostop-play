'use client';

import { memo, useState } from 'react';
import { CardId } from '@/engine/types';
import { getCard } from '@/engine/cards';

interface HwatuCardProps {
  cardId?: CardId;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  faceDown?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  interactive?: boolean;
  onClick?: (cardId: CardId) => void;
  flipAnimation?: boolean;
  className?: string;
  zone?: string;
}

const SIZES = {
  xs: { w: 36, h: 54 },
  sm: { w: 48, h: 72 },
  md: { w: 60, h: 90 },
  lg: { w: 72, h: 108 },
};

/**
 * 월별 SVG 스프라이트: 1600×600 (4장 가로 배열)
 * CSS background-image + background-position 으로 개별 카드 크롭
 */

/* ============================================================
   CARD FACE — CSS sprite crop
   ============================================================ */
const CardFace = memo(function CardFace({
  cardId,
  width,
  height,
}: {
  cardId: CardId;
  width: number;
  height: number;
}) {
  const card = getCard(cardId);
  const index = cardId - (card.month - 1) * 4;
  const monthStr = card.month.toString().padStart(2, '0');

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 3,
        backgroundImage: `url(/cards/month${monthStr}.svg)`,
        backgroundSize: `${width * 4}px ${height}px`,
        backgroundPosition: `${-width * index}px 0`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
});

/* ============================================================
   CARD BACK — 빨간 뒷면 (순수 CSS)
   ============================================================ */
const CardBack = memo(function CardBack({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 3,
        background: '#CC0000',
        border: '2px solid #000',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 안쪽 금색 테두리 */}
      <div
        style={{
          position: 'absolute',
          inset: 3,
          border: '1px solid #DAA520',
          borderRadius: 1,
        }}
      />
      {/* 두 번째 안쪽 테두리 */}
      <div
        style={{
          position: 'absolute',
          inset: 5,
          border: '0.5px solid #DAA520',
          borderRadius: 1,
          opacity: 0.5,
        }}
      />
    </div>
  );
});

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
function HwatuCard({
  cardId,
  size = 'md',
  faceDown = false,
  selected = false,
  highlighted = false,
  interactive = false,
  onClick,
  flipAnimation = false,
  className = '',
  zone,
}: HwatuCardProps) {
  const [flipped, setFlipped] = useState(!faceDown);
  const dim = SIZES[size];

  const handleClick = () => {
    if (!interactive || cardId === undefined) return;
    if (flipAnimation && !flipped) {
      setFlipped(true);
      setTimeout(() => onClick?.(cardId), 400);
    } else {
      onClick?.(cardId);
    }
  };

  const dataAttrs: Record<string, string | number | undefined> = {};
  if (cardId !== undefined) dataAttrs['data-card-id'] = cardId;
  if (zone) dataAttrs['data-card-zone'] = zone;

  if (flipAnimation) {
    return (
      <div
        className={`hwatu-card-container inline-block ${className}`}
        style={{ width: dim.w, height: dim.h }}
        onClick={handleClick}
        {...dataAttrs}
      >
        <div
          className={`hwatu-card-flipper ${flipped ? 'flipped' : ''}`}
          style={{ width: dim.w, height: dim.h }}
        >
          <div className="hwatu-card-back-face">
            <CardBack width={dim.w} height={dim.h} />
          </div>
          <div className="hwatu-card-front">
            {cardId !== undefined && (
              <CardFace cardId={cardId} width={dim.w} height={dim.h} />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (faceDown) {
    return (
      <div
        className={`inline-block ${className}`}
        style={{ width: dim.w, height: dim.h }}
        {...dataAttrs}
      >
        <CardBack width={dim.w} height={dim.h} />
      </div>
    );
  }

  if (cardId === undefined) return null;

  return (
    <div
      className={`hwatu-card inline-block ${selected ? 'selected' : ''} ${highlighted ? 'match-highlight' : ''} ${className}`}
      style={{
        width: dim.w,
        height: dim.h,
        cursor: interactive ? 'pointer' : 'default',
      }}
      onClick={handleClick}
      {...dataAttrs}
    >
      <CardFace cardId={cardId} width={dim.w} height={dim.h} />
    </div>
  );
}

export default memo(HwatuCard);
