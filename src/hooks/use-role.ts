"use client";

import { useAuthStore } from "@/stores/auth-store";
import type { ActiveView } from "@/lib/constants";

interface UseRoleReturn {
  activeView: ActiveView;
  isSeller: boolean;
  isManager: boolean;
  isSellerView: boolean;
}

export function useRole(): UseRoleReturn {
  const activeView = useAuthStore((s) => s.activeView);
  const isSeller = useAuthStore((s) => s.isSeller);
  const isManager = useAuthStore((s) => s.isManager);

  return {
    activeView,
    isSeller,
    isManager,
    isSellerView: activeView === "seller" && isSeller,
  };
}
