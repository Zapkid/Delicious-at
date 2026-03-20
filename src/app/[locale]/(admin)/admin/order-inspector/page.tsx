"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminOrderInspectorPage(): React.ReactElement {
  const t = useTranslations("admin.ordersInspector");
  const [orderId, setOrderId] = useState<string>("");
  const [json, setJson] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function load(): Promise<void> {
    const id: string = orderId.trim();
    if (!id) return;
    setLoading(true);
    const res: Response = await fetch(`/api/admin/orders/${id}`);
    const body: unknown = await res.json().catch(() => ({}));
    setJson(JSON.stringify(body, null, 2));
    setLoading(false);
  }

  return (
    <>
      <PageHeader title={t("title")} showBack />
      <main className="flex flex-col gap-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="oid">{t("search")}</Label>
          <div className="flex gap-2">
            <Input
              id="oid"
              value={orderId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOrderId(e.target.value)
              }
              placeholder="uuid"
            />
            <Button
              type="button"
              onClick={() => void load()}
              disabled={loading}
            >
              {t("load")}
            </Button>
          </div>
        </div>
        {json ? (
          <Card>
            <CardContent className="p-4">
              <pre className="max-h-[60vh] overflow-auto text-xs whitespace-pre-wrap">
                {json}
              </pre>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </>
  );
}
