import { useState, useRef, useEffect } from "react";
import { ChatCircle as MessageCircle, PaperPlaneRight as Send } from "@phosphor-icons/react";
import { Avatar } from "./Avatar";
import type { ChatMessage } from "../../types";

// ── Chat message list (reused in multiple contexts) ───────────────
export function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-3">
      {messages.map((m, i) => (
        <div key={`${m.player}-${m.time}-${i}`} className="flex gap-2.5">
          <Avatar name={m.player} color={m.color} size="sm" />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold" style={{ color: m.color }}>{m.player}</span>
              {m.isSpectator && <span className="text-[10px] bg-muted/50 px-1 rounded text-muted-foreground">👻</span>}
              <span className="text-xs text-muted-foreground">{m.time}</span>
            </div>
            <p className="text-xs text-foreground mt-0.5 leading-relaxed">{m.msg}</p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Chat section card (mobile) — now supports sending messages ────
export function ChatSection({
  messages,
  onSendMessage,
}: {
  messages: ChatMessage[];
  onSendMessage?: (msg: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm">Game Chat</h4>
      </div>

      {/* Messages */}
      <div className="px-4 py-3 max-h-56 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No messages yet…</p>
        ) : (
          <ChatMessages messages={messages} />
        )}
      </div>

      {/* Input — only shown when handler is provided */}
      {onSendMessage && (
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Send a message…"
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
              aria-label="Chat message input"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Desktop persistent chat sidebar (hidden on mobile) ────────────
export function ChatSidebar({
  messages,
  onSendMessage,
}: {
  messages: ChatMessage[];
  onSendMessage?: (msg: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

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
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Send a message…"
            className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            aria-label="Chat message input"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
