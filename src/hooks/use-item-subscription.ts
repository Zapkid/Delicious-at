"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useUser } from "@/hooks/use-user";

interface UseItemSubscriptionReturn {
  isSubscribed: boolean;
  toggle: () => Promise<void>;
  isLoading: boolean;
}

export function useItemSubscription(
  itemId: string
): UseItemSubscriptionReturn {
  const supabase = useSupabase();
  const { user } = useUser();
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function check(): Promise<void> {
      const { data } = await supabase
        .from("item_subscriptions")
        .select("id")
        .eq("user_id", user!.id)
        .eq("item_id", itemId)
        .maybeSingle();

      setIsSubscribed(!!data);
      setIsLoading(false);
    }

    check();
  }, [supabase, user, itemId]);

  const toggle = useCallback(async (): Promise<void> => {
    if (!user) return;

    if (isSubscribed) {
      await supabase
        .from("item_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", itemId);
      setIsSubscribed(false);
    } else {
      await supabase
        .from("item_subscriptions")
        .insert({ user_id: user.id, item_id: itemId } as never);
      setIsSubscribed(true);
    }
  }, [supabase, user, itemId, isSubscribed]);

  return { isSubscribed, toggle, isLoading };
}
