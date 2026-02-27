/**
 * POST /api/rooms/[code]/join — 방 참가
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

  if (room.status !== 'waiting') {
    return NextResponse.json({ error: '이미 시작된 게임입니다' }, { status: 400 });
  }

  // 이미 참가 중인지 확인
  const { data: existing } = await supabaseAdmin
    .from('gostop_room_players')
    .select('id, seat_index')
    .eq('room_id', room.id)
    .eq('player_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ room: { id: room.id, code: room.code }, seatIndex: existing.seat_index });
  }

  // 빈 좌석 찾기 (3인)
  const { data: players } = await supabaseAdmin
    .from('gostop_room_players')
    .select('seat_index')
    .eq('room_id', room.id);

  const takenSeats = new Set((players || []).map(p => p.seat_index));
  if (takenSeats.size >= 3) {
    return NextResponse.json({ error: '방이 가득 찼습니다' }, { status: 400 });
  }

  let assignedSeat = 0;
  for (let i = 0; i < 3; i++) {
    if (!takenSeats.has(i)) { assignedSeat = i; break; }
  }

  // 좌석 충돌 재시도
  let joinError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabaseAdmin
      .from('gostop_room_players')
      .insert({
        room_id: room.id,
        player_id: user.id,
        seat_index: assignedSeat,
        is_ai: false,
      });

    if (!error) {
      joinError = null;
      break;
    }
    joinError = error;
    const { data: retryPlayers } = await supabaseAdmin
      .from('gostop_room_players')
      .select('seat_index')
      .eq('room_id', room.id);
    const retryTaken = new Set((retryPlayers || []).map(p => p.seat_index));
    if (retryTaken.size >= 3) {
      return NextResponse.json({ error: '방이 가득 찼습니다' }, { status: 400 });
    }
    for (let i = 0; i < 3; i++) {
      if (!retryTaken.has(i)) { assignedSeat = i; break; }
    }
  }

  if (joinError) {
    return NextResponse.json({ error: '참가 실패' }, { status: 500 });
  }

  // Broadcast로 방 업데이트 알림
  await supabaseAdmin.channel(`room:${room.code}`).send({
    type: 'broadcast',
    event: 'room_update',
    payload: { type: 'player_joined', seatIndex: assignedSeat },
  });

  return NextResponse.json({ room: { id: room.id, code: room.code }, seatIndex: assignedSeat });
}
