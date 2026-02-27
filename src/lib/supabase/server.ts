/**
 * API Route용 Supabase 서버 클라이언트
 * 요청별 인증 컨텍스트로 RLS 적용
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** 요청의 Authorization 헤더에서 토큰으로 인증된 클라이언트 */
export function createAuthenticatedClient(authHeader: string | null) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}
