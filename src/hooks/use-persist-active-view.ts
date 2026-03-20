"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSupabase } from "@/hooks/use-supabase";
import { useUser } from "@/hooks/use-user";
import type { ActiveView } from "@/lib/constants";

/**
 * Updates Zustand and persists `profiles.active_view` so seller/user nav survives refresh.
 */
export function usePersistActiveView(): (view: ActiveView) => Promise<void> {
  const supabase = useSupabase();
  const { user } = useUser();
  const setActiveView = useAuthStore((s) => s.setActiveView);

  return useCallback(
    async (view: ActiveView): Promise<void> => {
      setActiveView(view);
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ active_view: view } as never)
        .eq("id", user.id);
    },
    [supabase, user, setActiveView]
  );
}
