'use client';

import { useOnlineGameStore } from '@/stores/useOnlineGameStore';
import { PRESET_MESSAGES } from '@/lib/online-types';

export default function ChatPanel() {
  const chatMessages = useOnlineGameStore(s => s.chatMessages);
  const chatOpen = useOnlineGameStore(s => s.chatOpen);
  const setChatOpen = useOnlineGameStore(s => s.setChatOpen);
  const unreadCount = useOnlineGameStore(s => s.unreadCount);
  const seatIndex = useOnlineGameStore(s => s.seatIndex);
  const realtimeChannel = useOnlineGameStore(s => s.realtimeChannel);
  const gameState = useOnlineGameStore(s => s.gameState);
  const addChatMessage = useOnlineGameStore(s => s.addChatMessage);

  const myName = seatIndex !== null && gameState
    ? gameState.players[seatIndex]?.name || '나'
    : '나';

  const sendPreset = (messageIndex: number) => {
    if (!realtimeChannel || seatIndex === null) return;

    const msg = {
      seatIndex,
      nickname: myName,
      messageIndex,
      timestamp: Date.now(),
    };

    realtimeChannel.send({
      type: 'broadcast',
      event: 'chat',
      payload: msg,
    });

    addChatMessage(msg, true);
  };

  return (
    <>
      {/* 채팅 버튼 */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-20 right-3 z-30 w-10 h-10 rounded-full
          bg-panel border border-white/10 flex items-center justify-center
          text-text-muted hover:text-text-primary transition-colors cursor-pointer"
      >
        <span className="text-sm">💬</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-action-danger
            text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 채팅 패널 */}
      {chatOpen && (
        <div className="fixed bottom-32 right-3 z-30 w-64 bg-panel rounded-xl border border-white/10
          shadow-lg animate-fade-in overflow-hidden">
          {/* 메시지 목록 */}
          <div className="max-h-32 overflow-y-auto p-2 space-y-1">
            {chatMessages.length === 0 ? (
              <div className="text-[10px] text-text-muted text-center py-2">
                메시지를 보내보세요
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className={`font-bold ${msg.seatIndex === seatIndex ? 'text-gold' : 'text-text-secondary'}`}>
                    {msg.nickname}
                  </span>
                  <span className="text-text-primary ml-1">
                    {PRESET_MESSAGES[msg.messageIndex]}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* 프리셋 버튼 */}
          <div className="border-t border-white/5 p-2 grid grid-cols-2 gap-1">
            {PRESET_MESSAGES.map((msg, i) => (
              <button
                key={i}
                onClick={() => sendPreset(i)}
                className="text-[10px] py-1 px-2 rounded bg-panel-light
                  text-text-secondary hover:text-text-primary hover:bg-white/5
                  transition-colors cursor-pointer truncate"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
