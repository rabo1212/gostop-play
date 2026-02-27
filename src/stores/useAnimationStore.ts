'use client';

import { create } from 'zustand';
import { CardId } from '@/engine/types';

export interface CardAnimation {
  id: string;
  cardId: CardId;
  fromRect: { left: number; top: number; width: number; height: number };
  toRect: { left: number; top: number; width: number; height: number } | null;
  type: 'play' | 'snap' | 'capture' | 'draw' | 'bomb';
  faceDown?: boolean;
  flipMidway?: boolean;
  duration: number;
  delay: number;
}

interface AnimationStore {
  queue: CardAnimation[];
  enqueue: (anim: CardAnimation) => void;
  enqueueBatch: (anims: CardAnimation[]) => void;
  dequeue: (id: string) => void;
  clear: () => void;
}

let animCounter = 0;
export function animId(prefix: string): string {
  return `${prefix}-${++animCounter}`;
}

export const useAnimationStore = create<AnimationStore>((set) => ({
  queue: [],

  enqueue: (anim) =>
    set((s) => ({ queue: [...s.queue, anim] })),

  enqueueBatch: (anims) =>
    set((s) => ({ queue: [...s.queue, ...anims] })),

  dequeue: (id) =>
    set((s) => ({ queue: s.queue.filter((a) => a.id !== id) })),

  clear: () => set({ queue: [] }),
}));
