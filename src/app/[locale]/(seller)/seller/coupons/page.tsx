"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import type { Tables } from "@/lib/supabase/types";

type CouponRow = Tables<"coupons">;

export default function SellerCouponsPage(): React.ReactElement {
  const t = useTranslations("seller.coupons");
  const { user } = useUser();
  const supabase = useSupabase();
  const [shopId, setShopId] = useState<string>("");
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [code, setCode] = useState<string>("");
  const [percent, setPercent] = useState<string>("10");
  const [expires, setExpires] = useState<string>("");

  const load = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("seller_id", user.id)
      .maybeSingle();
    const sid: string | undefined = (shop as { id: string } | null)?.id;
    if (!sid) {
      setLoading(false);
      return;
    }
    setShopId(sid);
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("shop_id", sid)
      .order("created_at", { ascending: false });
    setRows((data as CouponRow[] | null) ?? []);
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addCoupon(): Promise<void> {
    if (!shopId || !code.trim()) return;
    const p: number = Number(percent);
    if (Number.isNaN(p) || p <= 0 || p > 100) return;
    await supabase.from("coupons").insert({
      shop_id: shopId,
      code: code.trim(),
      discount_percent: p,
      expires_at: expires.trim() || null,
      is_active: true,
    } as never);
    setCode("");
    setExpires("");
    void load();
  }

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("add")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="c-code">{t("code")}</Label>
              <Input
                id="c-code"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCode(e.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-pct">{t("percent")}</Label>
              <Input
                id="c-pct"
                type="number"
                min={1}
                max={100}
                value={percent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPercent(e.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-exp">{t("expires")}</Label>
              <Input
                id="c-exp"
                value={expires}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setExpires(e.target.value)
                }
                placeholder="2026-12-31"
              />
            </div>
            <Button type="button" onClick={() => void addCoupon()}>
              {t("add")}
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((c: CouponRow) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <span className="font-mono">{c.code}</span>
                <span>{c.discount_percent}%</span>
                <Badge variant={c.is_active ? "default" : "secondary"}>
                  {c.is_active ? t("active") : t("inactive")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
