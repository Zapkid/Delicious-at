"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SellerMonthlyFee, Shop } from "@/types";

type FeeWithShop = SellerMonthlyFee & {
  shops: Pick<Shop, "name"> | null;
};

export default function AdminFeesPage(): React.ReactElement {
  const t = useTranslations("admin.fees");
  const [fees, setFees] = useState<FeeWithShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFees = useCallback(async (): Promise<void> => {
    try {
      const res: Response = await fetch("/api/admin/fees");
      if (!res.ok) {
        setFees([]);
        return;
      }
      const j: { data?: FeeWithShop[] } = await res.json();
      setFees(j.data ?? []);
    } catch {
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFees();
  }, [fetchFees]);

  async function handleVerify(feeId: string): Promise<void> {
    await fetch(`/api/admin/fees/${feeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    void fetchFees();
  }

  async function runAggregation(): Promise<void> {
    await fetch("/api/admin/monthly-fees/run", { method: "POST" });
    void fetchFees();
  }

  function downloadCsv(): void {
    const lines: string[] = [
      ["seller", "month", "total", "fee", "status"].join(","),
    ];
    for (const fee of fees) {
      lines.push(
        [
          JSON.stringify(fee.shops?.name ?? ""),
          fee.month,
          fee.total_order_value,
          fee.fee_amount,
          fee.status,
        ].join(",")
      );
    }
    const blob: Blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url: string = URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = "fees.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void runAggregation()}>
            {t("runAggregation")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={downloadCsv}
            disabled={fees.length === 0}
          >
            {t("exportCsv")}
          </Button>
        </div>
        {loading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("title")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-start font-medium">
                        {t("seller")}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t("month")}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t("amount")}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t("status")}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          {t("emptyState")}
                        </td>
                      </tr>
                    ) : (
                      fees.map(
                        (fee: FeeWithShop): React.ReactElement => (
                          <tr
                            key={fee.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-4 py-3">
                              {fee.shops?.name ?? "—"}
                            </td>
                            <td className="px-4 py-3">{fee.month}</td>
                            <td className="px-4 py-3">
                              <div className="space-y-0.5">
                                <p>₪{fee.fee_amount.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">
                                  of ₪{fee.total_order_value.toFixed(2)} total
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  fee.status === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {fee.status === "paid"
                                  ? t("verified")
                                  : t("unpaid")}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {fee.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void handleVerify(fee.id)}
                                >
                                  {t("verifyPayment")}
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
