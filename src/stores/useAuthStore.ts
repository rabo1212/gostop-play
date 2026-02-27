'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';

interface AuthStore {
  userId: string | null;
  nickname: string;
  isAuthenticated: boolean;
  isLoading: boolean;

  signInAnonymous: (nickname: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  changeNickname: (newNick: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      userId: null,
      nickname: '플레이어',
      isAuthenticated: false,
      isLoading: false,

      signInAnonymous: async (nickname: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;

          const userId = data.user?.id ?? null;
          if (userId) {
            await supabase
              .from('gostop_profiles')
              .upsert({ id: userId, nickname }, { onConflict: 'id' })
              .select();
          }

          set({ userId, nickname, isAuthenticated: true, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      restoreSession: async () => {
        set({ isLoading: true });
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const userId = data.session.user.id;
            const { data: profile } = await supabase
              .from('gostop_profiles')
              .select('nickname')
              .eq('id', userId)
              .single();

            set({
              userId,
              nickname: profile?.nickname ?? get().nickname,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      changeNickname: async (newNick: string) => {
        const { userId } = get();
        if (!userId) return false;
        const { error } = await supabase
          .from('gostop_profiles')
          .update({ nickname: newNick })
          .eq('id', userId);
        if (error) return false;
        set({ nickname: newNick });
        return true;
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ userId: null, nickname: '플레이어', isAuthenticated: false });
      },
    }),
    {
      name: 'gostop-auth',
      partialize: (state) => ({ nickname: state.nickname }),
    }
  )
);
