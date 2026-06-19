import { MessageCircle, Send } from "lucide-react";
import { Avatar } from "./Avatar";
import type { ChatMessage } from "../../types";

// ── Chat message list (reused in multiple contexts) ───────────────
export function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="space-y-3">
      {messages.map((m, i) => (
        <div key={`${m.player}-${m.time}-${i}`} className="flex gap-2.5">
          <Avatar name={m.player} color={m.color} size="sm" />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold" style={{ color: m.color }}>{m.player}</span>
              <span className="text-xs text-muted-foreground">{m.time}</span>
            </div>
            <p className="text-xs text-foreground mt-0.5 leading-relaxed">{m.msg}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Chat section card (mobile) ────────────────────────────────────
export function ChatSection({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm">Game Chat</h4>
      </div>
      <ChatMessages messages={messages} />
    </div>
  );
}

// ── Desktop persistent chat sidebar (was duplicated in Discussion + Voting) ──
export function ChatSidebar({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="hidden lg:flex flex-col w-[360px] border-l border-border bg-card/50 flex-shrink-0">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Game Chat</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <ChatMessages messages={messages} />
      </div>
      <div className="px-5 py-4 border-t border-border">
        <div className="flex gap-2">
          <input
            placeholder="Send a message…"
            className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            aria-label="Chat message input"
          />
          <button className="bg-primary text-white p-2 rounded-xl hover:opacity-90 transition-opacity" aria-label="Send message">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
