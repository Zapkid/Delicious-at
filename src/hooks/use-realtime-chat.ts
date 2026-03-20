"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import type { OrderMessage } from "@/types";

interface UseRealtimeChatReturn {
  messages: OrderMessage[];
  sendMessage: (body: string) => Promise<void>;
  isLoading: boolean;
}

export function useRealtimeChat(
  orderId: string,
  senderId: string
): UseRealtimeChatReturn {
  const supabase = useSupabase();
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchMessages(): Promise<void> {
      const { data } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      setMessages((data as OrderMessage[]) ?? []);
      setIsLoading(false);
    }

    fetchMessages();

    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as OrderMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, orderId]);

  const sendMessage = useCallback(
    async (body: string): Promise<void> => {
      await supabase.from("order_messages").insert({
        order_id: orderId,
        sender_id: senderId,
        body,
      } as never);
    },
    [supabase, orderId, senderId]
  );

  return { messages, sendMessage, isLoading };
}
