"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_LOCALE } from "@/lib/constants";

export default function AuthCallbackPage(): React.ReactElement {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.replace(`/${DEFAULT_LOCALE}/home`);
      }
    });

    const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
      router.replace(`/${DEFAULT_LOCALE}`);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
