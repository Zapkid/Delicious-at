"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthPayload {
  activeShopCount: number;
  activeShopsWithZeroItems: number;
  activeShopsWithoutOrdersLast30Days: number;
}

export default function AdminHealthPage(): React.ReactElement {
  const t = useTranslations("admin.health");
  const locale: string = useLocale();
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res: Response = await fetch("/api/admin/health");
      if (!res.ok) {
        setData(null);
        return;
      }
      const j: HealthPayload = (await res.json()) as HealthPayload;
      setData(j);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title={t("title")} showBack />
      <main className="flex flex-col gap-4 p-4">
        <Link
          href={`/${locale}/admin/order-inspector`}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Open order inspector →
        </Link>
        {loading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : data ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label={t("activeShops")}
              value={String(data.activeShopCount)}
            />
            <StatCard
              label={t("zeroItems")}
              value={String(data.activeShopsWithZeroItems)}
            />
            <StatCard
              label={t("inactiveShops")}
              value={String(data.activeShopsWithoutOrdersLast30Days)}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
