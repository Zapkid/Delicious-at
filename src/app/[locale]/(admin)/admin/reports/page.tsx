"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/lib/supabase/types";

type ReportRow = Tables<"reports">;

export default function AdminReportsPage(): React.ReactElement {
  const t = useTranslations("admin.reports");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res: Response = await fetch("/api/admin/reports");
      if (!res.ok) {
        setRows([]);
        return;
      }
      const j: { data?: ReportRow[] } = await res.json();
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

  return (
    <>
      <PageHeader title={t("title")} showBack />
      <main className="flex flex-col gap-3 p-4">
        {loading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          rows.map((r: ReportRow) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{r.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{r.body}</p>
                <p className="text-xs text-muted-foreground">
                  Shop: {r.shop_id ?? "—"} · Item: {r.item_id ?? "—"}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </>
  );
}
