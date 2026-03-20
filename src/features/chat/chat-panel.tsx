"use client";

import { useState, useRef, useEffect } from "react";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import { useUser } from "@/hooks/use-user";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface ChatPanelProps {
  orderId: string;
  messageTemplates?: readonly string[];
}

export function ChatPanel({
  orderId,
  messageTemplates,
}: ChatPanelProps): React.ReactElement {
  const { user } = useUser();
  const senderId: string = user?.id ?? "";
  const { messages, sendMessage, isLoading } = useRealtimeChat(
    orderId,
    senderId
  );
  const t = useTranslations("order");
  const [input, setInput] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(): Promise<void> {
    const body: string = input.trim();
    if (!body) return;
    setInput("");
    await sendMessage(body);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {messageTemplates && messageTemplates.length > 0 ? (
        <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
          {messageTemplates.map((tpl: string) => (
            <button
              key={tpl}
              type="button"
              className="rounded-full border border-border bg-muted/40 px-2 py-1 text-xs"
              onClick={() => setInput((prev: string) => (prev ? `${prev} ${tpl}` : tpl))}
            >
              {tpl}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isMine: boolean = msg.sender_id === senderId;
          return (
            <div
              key={msg.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                isMine
                  ? "ms-auto bg-primary text-primary-foreground"
                  : "me-auto bg-muted text-foreground"
              )}
            >
              {msg.body}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t("typeMessage")}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
