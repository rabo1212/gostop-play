'use client';

import { useState, useEffect, memo } from 'react';
import { useAnimationStore, CardAnimation } from '@/stores/useAnimationStore';
import { prefersReducedMotion } from '@/hooks/useCardPositions';
import HwatuCard from './HwatuCard';

/** 날아가는 카드 한 장 */
const FlyingCard = memo(function FlyingCard({
  animation,
  onComplete,
}: {
  animation: CardAnimation;
  onComplete: () => void;
}) {
  const { fromRect, toRect, duration, delay, cardId, flipMidway } = animation;
  const isFaceDown = animation.faceDown ?? false;

  const [phase, setPhase] = useState<'start' | 'fly'>('start');
  const [showFront, setShowFront] = useState(!isFaceDown);
  const target = toRect || fromRect;

  // 1프레임 뒤에 fly 위치로 전환 → CSS transition 발동
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setPhase('fly');
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  // fly 시작 후 duration+delay 경과하면 완료
  useEffect(() => {
    if (phase !== 'fly') return;
    const timer = setTimeout(onComplete, duration + delay + 50);
    return () => clearTimeout(timer);
  }, [phase, duration, delay, onComplete]);

  // 뒤집기 효과: 중간 지점에서 앞면으로 전환
  useEffect(() => {
    if (!flipMidway || phase !== 'fly') return;
    const timer = setTimeout(() => setShowFront(true), (duration + delay) / 2);
    return () => clearTimeout(timer);
  }, [phase, flipMidway, duration, delay]);

  const isStart = phase === 'start';
  const rect = isStart ? fromRect : target;

  const transitionValue = isStart
    ? 'none'
    : `left ${duration}ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, top ${duration}ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, width ${duration}ms ease ${delay}ms, height ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`;

  return (
    <div
      style={{
        position: 'fixed',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        transition: transitionValue,
        zIndex: 200,
        pointerEvents: 'none' as const,
        transform: flipMidway && !showFront ? 'rotateY(90deg)' : 'rotateY(0deg)',
        perspective: 800,
      }}
    >
      <HwatuCard
        cardId={showFront ? cardId : undefined}
        faceDown={!showFront}
        size="sm"
        className="!shadow-lg"
      />
    </div>
  );
});

/** 플로팅 애니메이션 오버레이 */
export default function AnimationLayer() {
  const queue = useAnimationStore((s) => s.queue);
  const dequeue = useAnimationStore((s) => s.dequeue);

  // 모션 감소 설정 시 즉시 완료 처리
  const reduced = prefersReducedMotion();

  if (queue.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
      {queue.map((anim) =>
        reduced ? null : (
          <FlyingCard
            key={anim.id}
            animation={anim}
            onComplete={() => dequeue(anim.id)}
          />
        )
      )}
    </div>
  );
}
