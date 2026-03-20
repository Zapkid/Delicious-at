"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useUser } from "@/hooks/use-user";
import type { Notification } from "@/types";
import type { UpdateTables } from "@/lib/supabase/types";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const supabase = useSupabase();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;

    async function fetch(): Promise<void> {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications((data as Notification[]) ?? []);
      setIsLoading(false);
    }

    fetch();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated: Notification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  const unreadCount: number = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id: string): Promise<void> {
    await (supabase
      .from("notifications") as ReturnType<typeof supabase.from>)
      .update({ is_read: true } as never)
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  return { notifications, unreadCount, markAsRead, isLoading };
}
