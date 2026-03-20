"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/layout/page-header";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import { useAuthStore } from "@/stores/auth-store";
import { usePersistActiveView } from "@/hooks/use-persist-active-view";
import { ACTIVE_VIEW } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default function ProfilePage(): React.ReactElement {
  const t = useTranslations("profile");
  const tSettings = useTranslations("settings");
  const tCommon = useTranslations("common");
  const supabase = useSupabase();
  const locale: string = useLocale();
  const { theme, setTheme } = useTheme();
  const { user, profile, isSeller, isManager, isLoading: profileLoading } = useUser();
  const activeView = useAuthStore((s) => s.activeView);
  const persistActiveView = usePersistActiveView();

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSaved(false);

    await supabase
      .from("profiles")
      .update({ full_name: name, phone } as never)
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (profileLoading) {
    return (
      <>
        <PageHeader title={t("title")} />
        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("title")} actions={<SignOutButton />} />
      <main className="flex flex-1 flex-col gap-6 p-4">
        {/* Avatar + email */}
        {profile && (() => {
          const avatarUrl: string | null =
            profile.avatar_url ??
            (user?.user_metadata?.avatar_url as string | undefined) ??
            (user?.user_metadata?.picture as string | undefined) ??
            null;
          return (
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
                  {(profile.full_name ?? "?")[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
            </div>
          );
        })()}

        {/* Edit profile */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("fullName")}</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? tCommon("loading") : saved ? "✓" : tCommon("save")}
          </Button>
        </form>

        <Separator />

        {/* Language */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {t("language")}
          </h2>
          <LanguageSwitcher defaultPathWhenEmpty="/profile" />
        </section>

        {/* Theme */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {t("theme")}
          </h2>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`rounded-lg px-3 py-2 text-sm capitalize ${theme === mode ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {t(mode)}
              </button>
            ))}
          </div>
        </section>

        <Separator />

        {/* Role */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {tSettings("role")}
          </h2>
          <div className="flex flex-col gap-3">
            {(!isSeller || isManager) && (
              <Link
                href={`/${locale}/become-seller`}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <span>{tSettings("becomeSeller")}</span>
              </Link>
            )}
            {(isSeller || isManager) && (
              <button
                type="button"
                onClick={() =>
                  void persistActiveView(
                    activeView === "seller" ? ACTIVE_VIEW.USER : ACTIVE_VIEW.SELLER
                  )
                }
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <span>
                  {activeView === "seller" ? tSettings("switchToUser") : tSettings("switchToSeller")}
                </span>
              </button>
            )}
            {isManager && (
              <Link
                href={`/${locale}/admin/applications`}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <span>{tSettings("switchToManager")}</span>
              </Link>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
