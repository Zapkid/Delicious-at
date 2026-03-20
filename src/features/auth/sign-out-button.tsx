"use client";

import { useSupabase } from "@/hooks/use-supabase";
import { useAuthStore } from "@/stores/auth-store";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton(): React.ReactElement {
  const supabase = useSupabase();
  const reset = useAuthStore((s) => s.reset);
  const t = useTranslations("auth");
  const locale: string = useLocale();
  const router = useRouter();

  async function handleSignOut(): Promise<void> {
    await supabase.auth.signOut();
    reset();
    router.push(`/${locale}/login`);
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      {t("signOut")}
    </button>
  );
}
