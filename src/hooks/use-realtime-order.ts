"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import type { Order } from "@/types";

export function useRealtimeOrder(orderId: string): {
  order: Order | null;
  isLoading: boolean;
} {
  const supabase = useSupabase();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetch(): Promise<void> {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      setOrder(data as Order | null);
      setIsLoading(false);
    }

    fetch();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, orderId]);

  return { order, isLoading };
}
