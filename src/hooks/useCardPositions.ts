import { CardId } from '@/engine/types';

type Rect = { left: number; top: number; width: number; height: number };

/** 특정 카드의 DOM 위치 반환 */
export function captureCardPosition(cardId: CardId, zone: string): Rect | null {
  const el = document.querySelector(
    `[data-card-id="${cardId}"][data-card-zone="${zone}"]`
  );
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/** 영역 중앙 위치 반환 */
export function captureZoneCenter(zone: string): Rect | null {
  const el = document.querySelector(`[data-zone="${zone}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/** 모션 감소 설정 확인 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
