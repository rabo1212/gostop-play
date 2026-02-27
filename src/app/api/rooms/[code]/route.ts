/**
 * GET /api/rooms/[code] — 방 정보 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: room, error } = await supabaseAdmin
    .from('gostop_rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !room) {
    return NextResponse.json({ error: '방을 찾을 수 없습니다' }, { status: 404 });
  }

  const { data: players } = await supabaseAdmin
    .from('gostop_room_players')
    .select('*')
    .eq('room_id', room.id)
    .order('seat_index');

  const playerIds = (players || []).filter(p => !p.is_ai).map(p => p.player_id);
  const { data: profiles } = playerIds.length > 0
    ? await supabaseAdmin
        .from('gostop_profiles')
        .select('id, nickname')
        .in('id', playerIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map(p => [p.id, p.nickname]));

  const roomPlayers = (players || []).map(p => ({
    id: p.player_id,
    nickname: p.is_ai ? `AI ${p.seat_index}` : (profileMap.get(p.player_id) || '플레이어'),
    seatIndex: p.seat_index,
    isAI: p.is_ai,
    isConnected: p.is_connected,
  }));

  return NextResponse.json({
    room: {
      id: room.id,
      code: room.code,
      hostId: room.host_id,
      status: room.status,
      difficulty: room.difficulty,
      roundCount: room.round_count,
      players: roomPlayers,
      createdAt: room.created_at,
    },
  });
}
