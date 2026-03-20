"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Check, X, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { SellerApplication, Profile } from "@/types";

type ApplicationWithProfile = SellerApplication & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};

const STATUS_VARIANT: Record<
  SellerApplication["status"],
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const SLA_MS: number = 7 * 24 * 60 * 60 * 1000;

function isSlaOverdue(app: ApplicationWithProfile): boolean {
  if (app.status !== "pending") return false;
  return Date.now() - new Date(app.created_at).getTime() > SLA_MS;
}

export default function AdminApplicationsPage(): React.ReactElement {
  const t = useTranslations("admin.applications");
  const locale: string = useLocale();
  const [applications, setApplications] = useState<ApplicationWithProfile[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<string>("all");

  const fetchApplications = useCallback(async (): Promise<void> => {
    try {
      const res: Response = await fetch("/api/admin/seller-applications");
      if (!res.ok) {
        setApplications([]);
        return;
      }
      const json: { data?: ApplicationWithProfile[] } = await res.json();
      setApplications(json.data ?? []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const filtered: ApplicationWithProfile[] = useMemo(() => {
    if (tab === "sla") {
      return applications.filter((a: ApplicationWithProfile) =>
        isSlaOverdue(a)
      );
    }
    return applications;
  }, [applications, tab]);

  function toggleSelect(id: string): void {
    setSelected((prev: Set<string>) => {
      const next: Set<string> = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAction(
    id: string,
    status: "approved" | "rejected"
  ): Promise<void> {
    await fetch(`/api/admin/seller-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void fetchApplications();
  }

  async function bulk(
    status: "approved" | "rejected"
  ): Promise<void> {
    const ids: string[] = [...selected];
    if (ids.length === 0) return;
    await fetch("/api/admin/seller-applications/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status }),
    });
    setSelected(new Set());
    void fetchApplications();
  }

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void bulk("approved")}
            disabled={selected.size === 0}
          >
            {t("bulkApprove")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void bulk("rejected")}
            disabled={selected.size === 0}
          >
            {t("bulkReject")}
          </Button>
          <span className="text-xs text-muted-foreground">{t("selectHint")}</span>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
            <TabsTrigger value="sla">{t("sla")}</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title={t("emptyState")}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(
                  (app: ApplicationWithProfile): React.ReactElement => (
                    <Card key={app.id}>
                      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                        <Checkbox
                          checked={selected.has(app.id)}
                          onCheckedChange={() => toggleSelect(app.id)}
                          className="mt-1"
                          aria-label="Select application"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/${locale}/admin/applications/${app.id}`}
                              className="font-semibold hover:underline"
                            >
                              <CardTitle className="text-base">
                                {app.business_name}
                              </CardTitle>
                            </Link>
                            <Badge variant={STATUS_VARIANT[app.status]}>
                              {app.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          {app.profiles?.full_name ?? "—"}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground break-all">
                          {app.profiles?.email ?? "—"}
                        </p>
                        <p className="text-muted-foreground">{app.phone}</p>
                        {app.status === "pending" && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              data-testid="approve-application"
                              onClick={() =>
                                void handleAction(app.id, "approved")
                              }
                            >
                              <Check className="h-4 w-4" />
                              {t("approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                void handleAction(app.id, "rejected")
                              }
                            >
                              <X className="h-4 w-4" />
                              {t("reject")}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
