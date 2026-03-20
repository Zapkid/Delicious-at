"use client";

import { useEffect, useRef } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useAuthStore } from "@/stores/auth-store";
import type { Profile } from "@/types";
import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { FORCE_SELLER_NAV_SESSION_KEY } from "@/lib/constants";

function applySellerNavAfterAdminOverride(): void {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(FORCE_SELLER_NAV_SESSION_KEY) !== "1") {
    return;
  }
  sessionStorage.removeItem(FORCE_SELLER_NAV_SESSION_KEY);
  useAuthStore.getState().setActiveView("seller");
}

async function fetchProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return (data as Profile | null) ?? null;
}

function applyAuthSession(
  session: Session | null,
  supabase: SupabaseClient<Database>,
  setSession: (s: Session | null) => void,
  setProfile: (p: Profile | null) => void,
  setLoading: (loading: boolean) => void
): void {
  setSession(session);
  if (session?.user) {
    void fetchProfile(supabase, session.user.id)
      .then((profile: Profile | null) => {
        setProfile(profile);
        applySellerNavAfterAdminOverride();
      })
      .catch(() => {
        setProfile(null);
      });
  } else {
    setProfile(null);
  }
  setLoading(false);
}

export function AuthListener(): null {
  const supabase = useSupabase();
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const resolved = useRef<boolean>(false);

  useEffect(() => {
    const fallbackTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
      if (!resolved.current) {
        resolved.current = true;
        setLoading(false);
      }
    }, 8000);

    void supabase.auth
      .getSession()
      .then(
        ({ data: { session } }: { data: { session: Session | null } }) => {
          if (resolved.current) {
            return;
          }
          resolved.current = true;
          clearTimeout(fallbackTimer);
          applyAuthSession(
            session,
            supabase,
            setSession,
            setProfile,
            setLoading
          );
        }
      )
      .catch(() => {
        if (!resolved.current) {
          resolved.current = true;
          clearTimeout(fallbackTimer);
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!resolved.current) {
          resolved.current = true;
          clearTimeout(fallbackTimer);
        }

        if (event === "TOKEN_REFRESHED") {
          setSession(session);
          setLoading(false);
          return;
        }

        applyAuthSession(
          session,
          supabase,
          setSession,
          setProfile,
          setLoading
        );
      }
    );

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [supabase, setSession, setProfile, setLoading]);

  return null;
}
