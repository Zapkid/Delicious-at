"use client";

import { useAuthStore } from "@/stores/auth-store";
import type { Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

interface UseUserReturn {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isSeller: boolean;
  isManager: boolean;
  isLoading: boolean;
}

export function useUser(): UseUserReturn {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSeller = useAuthStore((s) => s.isSeller);
  const isManager = useAuthStore((s) => s.isManager);
  const isLoading = useAuthStore((s) => s.isLoading);

  return { user, profile, isAuthenticated, isSeller, isManager, isLoading };
}
