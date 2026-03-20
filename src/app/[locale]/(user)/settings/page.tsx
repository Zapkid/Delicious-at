"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/layout/page-header";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { useUser } from "@/hooks/use-user";
import { useAuthStore } from "@/stores/auth-store";
import { usePersistActiveView } from "@/hooks/use-persist-active-view";
import { ACTIVE_VIEW } from "@/lib/constants";

export default function SettingsPage(): React.ReactElement {
  const t = useTranslations("settings");
  const tProfile = useTranslations("profile");
  const locale: string = useLocale();
  const { theme, setTheme } = useTheme();
  const { isSeller, isManager } = useUser();
  const activeView = useAuthStore((s) => s.activeView);
  const persistActiveView = usePersistActiveView();

  return (
    <>
      <PageHeader title={t("title")} actions={<SignOutButton />} />
      <main className="flex flex-1 flex-col gap-6 p-4">
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {tProfile("language")}
          </h2>
          <LanguageSwitcher defaultPathWhenEmpty="/settings" />
        </section>
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {tProfile("theme")}
          </h2>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`rounded-lg px-3 py-2 text-sm capitalize ${theme === mode ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {tProfile(mode)}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {t("role")}
          </h2>
          <div className="flex flex-col gap-3">
            {!isSeller ? (
              <Link
                href={`/${locale}/become-seller`}
                className="rounded-lg border border-primary bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
              >
                {t("becomeSeller")}
              </Link>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                <span className="text-sm">
                  {activeView === "seller" ? t("switchToUser") : t("switchToSeller")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    void persistActiveView(
                      activeView === "seller" ? ACTIVE_VIEW.USER : ACTIVE_VIEW.SELLER
                    )
                  }
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  {activeView === "seller" ? t("switchToUser") : t("switchToSeller")}
                </button>
              </div>
            )}
            {isManager && (
              <Link
                href={`/${locale}/admin/applications`}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3"
              >
                <span className="text-sm">{t("switchToManager")}</span>
              </Link>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
