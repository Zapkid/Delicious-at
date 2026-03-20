"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Store } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApprovedSellerRow } from "@/types";
import { FORCE_SELLER_NAV_SESSION_KEY } from "@/lib/constants";

export default function AdminOverrideSellersPage(): React.ReactElement {
  const t = useTranslations("admin.overrideSellers");
  const locale: string = useLocale();
  const router = useRouter();
  const [rows, setRows] = useState<ApprovedSellerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res: Response = await fetch("/api/admin/approved-sellers");
      if (!res.ok) {
        setRows([]);
        return;
      }
      const j: { data?: ApprovedSellerRow[] } = await res.json();
      setRows(j.data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function switchToSeller(email: string): Promise<void> {
    setBusyEmail(email);
    setError(null);
    const res: Response = await fetch("/api/admin/seller-override-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg: string =
        typeof json === "object" &&
        json !== null &&
        "error" in json &&
        typeof (json as { error: unknown }).error === "string"
          ? (json as { error: string }).error
          : t("switchFailed");
      setError(msg);
      setBusyEmail(null);
      return;
    }
    const redirect: string | undefined =
      typeof json === "object" &&
      json !== null &&
      "redirect" in json &&
      typeof (json as { redirect: unknown }).redirect === "string"
        ? (json as { redirect: string }).redirect
        : `/${locale}/seller/dashboard`;
    sessionStorage.setItem(FORCE_SELLER_NAV_SESSION_KEY, "1");
    router.replace(redirect);
    router.refresh();
    setBusyEmail(null);
  }

  return (
    <>
      <PageHeader title={t("title")} showBack />
      <main className="flex flex-col gap-4 p-4">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((s: ApprovedSellerRow) => (
              <Card key={s.userId}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">
                      {s.shopName ?? t("noShop")}
                    </CardTitle>
                  </div>
                  <CardDescription className="space-y-1">
                    <span className="block font-mono text-xs">{s.email}</span>
                    {s.fullName && (
                      <span className="block text-xs">{s.fullName}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={busyEmail !== null}
                    onClick={() => void switchToSeller(s.email)}
                    data-testid={`switch-override-seller-${s.email.split("@")[0]}`}
                  >
                    {busyEmail === s.email ? t("switching") : t("switchAs")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{t("footnote")}</p>
      </main>
    </>
  );
}
