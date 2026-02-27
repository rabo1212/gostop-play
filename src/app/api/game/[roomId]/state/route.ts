/**
 * GET /api/game/[roomId]/state — 현재 게임 상태 조회 (재접속용)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hydrateGameState, createPlayerDTO } from '@/engine/dto';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const authHeader = req.headers.get('authorization');
  const supabase = createAuthenticatedClient(authHeader);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  // 플레이어의 좌석 확인
  const { data: playerRow } = await supabaseAdmin
    .from('gostop_room_players')
    .select('seat_index')
    .eq('room_id', roomId)
    .eq('player_id', user.id)
    .single();

  if (!playerRow) {
    return NextResponse.json({ error: '이 방의 참가자가 아닙니다' }, { status: 403 });
  }

  // 게임 상태 조회
  const { data: gameStateRow } = await supabaseAdmin
    .from('gostop_game_states')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (!gameStateRow) {
    return NextResponse.json({ error: '게임 상태를 찾을 수 없습니다' }, { status: 404 });
  }

  const state = hydrateGameState(gameStateRow.state);

  // 턴 데드라인 → 남은 ms
  let turnDeadlineMs: number | null = null;
  if (gameStateRow.turn_deadline) {
    turnDeadlineMs = Math.max(0, new Date(gameStateRow.turn_deadline).getTime() - Date.now());
  }

  const dto = createPlayerDTO(state, playerRow.seat_index, turnDeadlineMs);

  return NextResponse.json({
    gameState: dto,
    version: gameStateRow.version,
    seatIndex: playerRow.seat_index,
  });
}
