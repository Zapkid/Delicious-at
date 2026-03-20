"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import type { SellerMonthlyFee } from "@/types";

export default function SellerBillingPage(): React.ReactElement {
  const t = useTranslations("seller.billing");
  const locale: string = useLocale();
  const { user } = useUser();
  const supabase = useSupabase();

  const [loading, setLoading] = useState<boolean>(true);
  const [fees, setFees] = useState<SellerMonthlyFee[]>([]);
  const [shopId, setShopId] = useState<string>("");

  const fetchFees = useCallback(async (): Promise<void> => {
    if (!user) return;

    const { data: shopData } = await supabase
      .from("shops")
      .select("id")
      .eq("seller_id", user.id)
      .single();

    const shop = shopData as { id: string } | null;
    if (!shop) return;

    setShopId(shop.id);

    const { data } = await supabase
      .from("seller_monthly_fees")
      .select("*")
      .eq("shop_id", shop.id)
      .order("month", { ascending: false });

    setFees((data ?? []) as SellerMonthlyFee[]);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  async function handleUploadProof(feeId: string): Promise<void> {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";

    input.onchange = async (): Promise<void> => {
      const file: File | undefined = input.files?.[0];
      if (!file) return;

      const path: string = `fee-proofs/${shopId}/${feeId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(path, file);

      if (uploadError) return;

      const { data: urlData } = supabase.storage
        .from("proofs")
        .getPublicUrl(path);

      await supabase.from("seller_fee_payments").insert({
        fee_id: feeId,
        proof_url: urlData.publicUrl,
      } as never);

      fetchFees();
    };

    input.click();
  }

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("commissionNote")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("commissionDisclaimer")}</p>
            <Link
              href={`/${locale}/seller/coupons`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("manageCoupons")}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("monthlyFees")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : fees.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("noFees")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-start font-medium">
                        {t("month")}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t("totalOrders")}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t("fee")}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t("status")}
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee: SellerMonthlyFee) => (
                      <tr
                        key={fee.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3">{fee.month}</td>
                        <td className="px-4 py-3">
                          ₪{fee.total_order_value.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          ₪{fee.fee_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              fee.status === "paid" ? "default" : "secondary"
                            }
                          >
                            {t(fee.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {fee.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUploadProof(fee.id)}
                            >
                              <Upload className="h-4 w-4" />
                              {t("uploadProof")}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
