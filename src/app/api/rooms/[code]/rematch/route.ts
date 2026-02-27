/**
 * POST /api/rooms/[code]/rematch — 같은 방에서 재대국
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createInitialGameState, startGame } from '@/engine/game-manager';
import { serializeFullState } from '@/engine/dto';
import { processAITurns, getDeadlineMs } from '@/lib/ai-turn-processor';
import type { Difficulty } from '@/engine/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const authHeader = req.headers.get('authorization');
  const supabase = createAuthenticatedClient(authHeader);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { data: room } = await supabaseAdmin
    .from('gostop_rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (!room) {
    return NextResponse.json({ error: '방을 찾을 수 없습니다' }, { status: 404 });
  }

  if (room.host_id !== user.id) {
    return NextResponse.json({ error: '호스트만 재대국을 시작할 수 있습니다' }, { status: 403 });
  }

  // 새 게임 상태 생성
  const difficulty = (room.difficulty || 'normal') as Difficulty;
  const initial = createInitialGameState(difficulty);
  let gameState = startGame(initial);

  // 참가자 정보 패치
  const { data: allPlayers } = await supabaseAdmin
    .from('gostop_room_players')
    .select('seat_index, is_ai, player_id')
    .eq('room_id', room.id)
    .order('seat_index');

  if (allPlayers) {
    const humanIds = allPlayers.filter(p => !p.is_ai).map(p => p.player_id);
    const { data: profiles } = humanIds.length > 0
      ? await supabaseAdmin
          .from('gostop_profiles')
          .select('id, nickname')
          .in('id', humanIds)
      : { data: [] };

    const seatNames = ['선', '중', '끝'];
    for (const p of allPlayers) {
      gameState.players[p.seat_index].isAI = p.is_ai;
      if (!p.is_ai) {
        const profile = profiles?.find(pr => pr.id === p.player_id);
        gameState.players[p.seat_index].name = profile?.nickname || '플레이어';
      } else {
        gameState.players[p.seat_index].name = `AI (${seatNames[p.seat_index]})`;
      }
    }
  }

  // AI 체이닝
  if (gameState.players[gameState.turnIndex].isAI) {
    gameState = processAITurns(gameState);
  }

  const deadlineMs = getDeadlineMs(gameState.phase);
  const turnDeadline = deadlineMs ? new Date(Date.now() + deadlineMs).toISOString() : null;

  // 기존 game_states 업데이트
  const { error: stateError } = await supabaseAdmin
    .from('gostop_game_states')
    .update({
      state: serializeFullState(gameState),
      version: 0,
      turn_deadline: turnDeadline,
      updated_at: new Date().toISOString(),
    })
    .eq('room_id', room.id);

  if (stateError) {
    return NextResponse.json({ error: '게임 상태 저장 실패' }, { status: 500 });
  }

  // 방 상태 변경
  await supabaseAdmin
    .from('gostop_rooms')
    .update({ status: 'playing', updated_at: new Date().toISOString() })
    .eq('id', room.id);

  // Broadcast
  await supabaseAdmin.channel(`room:${room.code}`).send({
    type: 'broadcast',
    event: 'room_update',
    payload: { status: 'rematch', roomId: room.id },
  });

  return NextResponse.json({ started: true, roomId: room.id });
}
