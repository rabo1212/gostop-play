/**
 * POST /api/game/[roomId]/action — 게임 액션 제출
 * CAS(Compare-And-Swap) 기반 낙관적 잠금
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hydrateGameState, serializeFullState, createPlayerDTO } from '@/engine/dto';
import { playHandCard, selectMatchTarget, declareGo, declareStop, declareBomb } from '@/engine/game-manager';
import { autoProgressAfterPlay, processAITurns, getDeadlineMs } from '@/lib/ai-turn-processor';
import type { GoStopGameAction } from '@/lib/online-types';
import type { GameState, Month } from '@/engine/types';

export async function POST(
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

  const body = await req.json().catch(() => ({}));
  const action = body.action as GoStopGameAction;
  const clientVersion = body.version as number;

  if (!action?.type) {
    return NextResponse.json({ error: '유효하지 않은 액션' }, { status: 400 });
  }

  // 좌석 확인
  const { data: playerRow } = await supabaseAdmin
    .from('gostop_room_players')
    .select('seat_index')
    .eq('room_id', roomId)
    .eq('player_id', user.id)
    .single();

  if (!playerRow) {
    return NextResponse.json({ error: '이 방의 참가자가 아닙니다' }, { status: 403 });
  }

  const seatIndex = playerRow.seat_index;

  // 게임 상태 조회 + CAS 체크
  const { data: gameStateRow } = await supabaseAdmin
    .from('gostop_game_states')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (!gameStateRow) {
    return NextResponse.json({ error: '게임 상태를 찾을 수 없습니다' }, { status: 404 });
  }

  if (gameStateRow.version !== clientVersion) {
    return NextResponse.json({ error: '상태 충돌. 새로고침 해주세요.', stale: true }, { status: 409 });
  }

  let state = hydrateGameState(gameStateRow.state);

  if (state.phase === 'game-over' || state.phase === 'idle') {
    return NextResponse.json({ error: '게임이 종료되었습니다' }, { status: 400 });
  }

  // 턴 검증 (go-stop은 goStopPlayer, 나머지는 turnIndex)
  if (state.phase === 'go-stop-decision') {
    if (state.goStopPlayer !== seatIndex) {
      return NextResponse.json({ error: '당신의 결정 차례가 아닙니다' }, { status: 400 });
    }
  } else {
    if (state.turnIndex !== seatIndex) {
      return NextResponse.json({ error: '당신의 차례가 아닙니다' }, { status: 400 });
    }
  }

  // 액션 적용
  try {
    state = applyAction(state, action, seatIndex);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // 사람 카드 내기 후 자동 진행 (draw → resolve)
  if (action.type === 'play-hand-card' && state.phase !== 'hand-match-select') {
    state = autoProgressAfterPlay(state);
  }

  // match-select 후에도 자동 진행
  if (action.type === 'select-match-target') {
    if (state.phase === 'draw') {
      state = autoProgressAfterPlay(state);
    } else if (state.phase === 'resolve-capture') {
      // draw-match-select → resolve까지
      const { resolveCapture } = await import('@/engine/game-manager');
      state = resolveCapture(state);
      if (state.phase === 'play-hand' && state.players[state.turnIndex].isAI) {
        state = processAITurns(state);
      }
    }
  }

  // go/stop 후 AI 체이닝
  if (action.type === 'declare-go' || action.type === 'declare-stop') {
    if (state.phase === 'play-hand' && state.players[state.turnIndex].isAI) {
      state = processAITurns(state);
    }
  }

  // bomb 후 go-stop이 아니면 계속 play-hand (사람이 카드 내야 함)
  // go-stop 후 play-hand가 AI면 체이닝
  if (action.type === 'declare-bomb') {
    if (state.phase === 'play-hand' && state.players[state.turnIndex].isAI) {
      state = processAITurns(state);
    }
  }

  // 타이머 설정
  const deadlineMs = getDeadlineMs(state.phase);
  const turnDeadline = deadlineMs ? new Date(Date.now() + deadlineMs).toISOString() : null;
  const newVersion = gameStateRow.version + 1;

  // CAS 저장
  const { error: updateError } = await supabaseAdmin
    .from('gostop_game_states')
    .update({
      state: serializeFullState(state),
      version: newVersion,
      turn_deadline: turnDeadline,
      updated_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
    .eq('version', gameStateRow.version);

  if (updateError) {
    return NextResponse.json({ error: '상태 저장 실패' }, { status: 500 });
  }

  // 방 코드 조회 (broadcast용)
  const { data: room } = await supabaseAdmin
    .from('gostop_rooms')
    .select('code')
    .eq('id', roomId)
    .single();

  // 플레이어별 DTO broadcast
  if (room) {
    const channel = supabaseAdmin.channel(`room:${room.code}`);
    const turnMs = deadlineMs ? deadlineMs : null;

    // 모든 좌석에 해당 좌석 기준 DTO 전송
    const { data: allPlayers } = await supabaseAdmin
      .from('gostop_room_players')
      .select('seat_index, is_ai')
      .eq('room_id', roomId);

    for (const p of (allPlayers || [])) {
      if (p.is_ai) continue;
      const dto = createPlayerDTO(state, p.seat_index, turnMs);
      await channel.send({
        type: 'broadcast',
        event: `game_state:${p.seat_index}`,
        payload: { gameState: dto, version: newVersion },
      });
    }
  }

  // 게임 종료 시 기록 저장
  if (state.phase === 'game-over') {
    await supabaseAdmin
      .from('gostop_rooms')
      .update({ status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', roomId);

    await supabaseAdmin.from('gostop_game_history').insert({
      room_id: roomId,
      winner_id: state.winner !== null ? (await getPlayerUserId(roomId, state.winner)) : null,
      players: state.players.map(p => ({ name: p.name, isAI: p.isAI })),
      result: state.gameResult,
      rounds: 1,
    });
  }

  // 요청자에게 바로 응답
  const myDto = createPlayerDTO(state, seatIndex, deadlineMs);
  return NextResponse.json({
    gameState: myDto,
    version: newVersion,
  });
}

/** 액션을 상태에 적용 */
function applyAction(state: GameState, action: GoStopGameAction, seatIndex: number): GameState {
  switch (action.type) {
    case 'play-hand-card': {
      if (state.phase !== 'play-hand') throw new Error('카드를 낼 수 있는 단계가 아닙니다');
      if (!state.players[seatIndex].hand.includes(action.cardId)) {
        throw new Error('손패에 없는 카드입니다');
      }
      return playHandCard(state, action.cardId);
    }
    case 'select-match-target': {
      if (state.phase !== 'hand-match-select' && state.phase !== 'draw-match-select') {
        throw new Error('매칭 선택 단계가 아닙니다');
      }
      if (!state.pendingMatchOptions.includes(action.targetId)) {
        throw new Error('유효하지 않은 매칭 선택입니다');
      }
      return selectMatchTarget(state, action.targetId);
    }
    case 'declare-go': {
      if (state.phase !== 'go-stop-decision') throw new Error('고/스톱 단계가 아닙니다');
      return declareGo(state);
    }
    case 'declare-stop': {
      if (state.phase !== 'go-stop-decision') throw new Error('고/스톱 단계가 아닙니다');
      return declareStop(state);
    }
    case 'declare-bomb': {
      if (state.phase !== 'play-hand') throw new Error('폭탄을 선언할 수 있는 단계가 아닙니다');
      return declareBomb(state, action.month as Month);
    }
    case 'timeout': {
      // 타임아웃: 자동 행동
      if (state.phase === 'play-hand') {
        const hand = state.players[seatIndex].hand;
        const randomCard = hand[Math.floor(Math.random() * hand.length)];
        return playHandCard(state, randomCard);
      }
      if (state.phase === 'hand-match-select' || state.phase === 'draw-match-select') {
        return selectMatchTarget(state, state.pendingMatchOptions[0]);
      }
      if (state.phase === 'go-stop-decision') {
        return declareStop(state);
      }
      throw new Error('타임아웃 처리 불가');
    }
    default:
      throw new Error('알 수 없는 액션');
  }
}

/** 플레이어 좌석으로 userId 조회 */
async function getPlayerUserId(roomId: string, seatIndex: number): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('gostop_room_players')
    .select('player_id')
    .eq('room_id', roomId)
    .eq('seat_index', seatIndex)
    .single();
  return data?.player_id ?? null;
}
