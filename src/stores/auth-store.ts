"use client";

import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import { isManagerEmail, type ActiveView } from "@/lib/constants";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;

  // Derived
  isAuthenticated: boolean;
  isSeller: boolean;
  isManager: boolean;
  activeView: ActiveView;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setActiveView: (view: ActiveView) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isSeller: false,
  isManager: false,
  activeView: "user",

  setSession: (session: Session | null) =>
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session?.user,
    }),

  setProfile: (profile: Profile | null) =>
    set({
      profile,
      isSeller: profile?.is_seller_approved ?? false,
      isManager: isManagerEmail(profile?.email ?? ""),
      activeView: profile?.active_view ?? "user",
    }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setActiveView: (activeView: ActiveView) => set({ activeView }),

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      isSeller: false,
      isManager: false,
      activeView: "user",
    }),
}));
