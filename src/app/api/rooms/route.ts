/**
 * GET /api/rooms — 대기 중인 방 목록
 * POST /api/rooms — 방 생성
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateRoomCode } from '@/lib/room-code';

export async function GET() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: rooms, error } = await supabaseAdmin
    .from('gostop_rooms')
    .select('id, code, host_id, difficulty, round_count, created_at')
    .eq('status', 'waiting')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: '방 목록 조회 실패' }, { status: 500 });
  }

  if (!rooms || rooms.length === 0) {
    return NextResponse.json({ rooms: [] });
  }

  const roomIds = rooms.map(r => r.id);
  const { data: allPlayers } = await supabaseAdmin
    .from('gostop_room_players')
    .select('room_id, is_ai')
    .in('room_id', roomIds);

  const hostIds = Array.from(new Set(rooms.map(r => r.host_id)));
  const { data: profiles } = await supabaseAdmin
    .from('gostop_profiles')
    .select('id, nickname')
    .in('id', hostIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p.nickname]));
  const playerCountMap = new Map<string, number>();
  for (const p of (allPlayers || [])) {
    if (!p.is_ai) {
      playerCountMap.set(p.room_id, (playerCountMap.get(p.room_id) || 0) + 1);
    }
  }

  const result = rooms.map(r => ({
    id: r.id,
    code: r.code,
    hostNickname: profileMap.get(r.host_id) || '플레이어',
    playerCount: playerCountMap.get(r.id) || 0,
    difficulty: r.difficulty,
    roundCount: r.round_count,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ rooms: result });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const supabase = createAuthenticatedClient(authHeader);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const difficulty = ['easy', 'normal', 'hard'].includes(body.difficulty) ? body.difficulty : 'normal';
  const roundCount = [1, 3].includes(body.roundCount) ? body.roundCount : 3;

  // 코드 생성 (충돌 시 재시도)
  let code = '';
  let codeFound = false;
  for (let i = 0; i < 5; i++) {
    code = generateRoomCode();
    const { data: existing } = await supabaseAdmin
      .from('gostop_rooms')
      .select('id')
      .eq('code', code)
      .single();
    if (!existing) { codeFound = true; break; }
  }

  if (!codeFound) {
    return NextResponse.json({ error: '방 코드 생성 실패' }, { status: 500 });
  }

  const { data: room, error: roomError } = await supabaseAdmin
    .from('gostop_rooms')
    .insert({
      code,
      host_id: user.id,
      status: 'waiting',
      difficulty,
      round_count: roundCount,
    })
    .select()
    .single();

  if (roomError) {
    return NextResponse.json({ error: '방 생성 실패' }, { status: 500 });
  }

  // 호스트를 seat 0에 참가
  const { error: joinError } = await supabaseAdmin
    .from('gostop_room_players')
    .insert({
      room_id: room.id,
      player_id: user.id,
      seat_index: 0,
      is_ai: false,
    });

  if (joinError) {
    await supabaseAdmin.from('gostop_rooms').delete().eq('id', room.id);
    return NextResponse.json({ error: '방 생성 실패' }, { status: 500 });
  }

  return NextResponse.json({ room: { id: room.id, code: room.code } });
}
