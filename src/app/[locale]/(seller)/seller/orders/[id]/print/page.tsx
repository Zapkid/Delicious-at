"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabase } from "@/hooks/use-supabase";
import { useUser } from "@/hooks/use-user";

export default function OrderPrintPage(): React.ReactElement {
  const params = useParams();
  const id: string = String(params.id ?? "");
  const supabase = useSupabase();
  const { user } = useUser();
  const [line, setLine] = useState<string>("");

  useEffect(() => {
    async function load(): Promise<void> {
      if (!user || !id) return;
      const { data: shopRow } = await supabase
        .from("shops")
        .select("id")
        .eq("seller_id", user.id)
        .maybeSingle();
      const shopId: string | undefined = (shopRow as { id: string } | null)
        ?.id;
      if (!shopId) return;

      const { data: order } = await supabase
        .from("orders")
        .select("*, items(name), profiles!consumer_id(full_name)")
        .eq("id", id)
        .eq("shop_id", shopId)
        .maybeSingle();

      if (!order) {
        setLine("Order not found");
        return;
      }

      const o = order as {
        items: { name: string } | null;
        profiles: { full_name: string | null } | null;
        note: string | null;
        wants_delivery: boolean;
      };
      setLine(
        [
          `Item: ${o.items?.name ?? "—"}`,
          `Customer: ${o.profiles?.full_name ?? "—"}`,
          `Note: ${o.note ?? "—"}`,
          `Delivery: ${o.wants_delivery ? "yes" : "no"}`,
        ].join("\n")
      );
    }

    void load();
  }, [supabase, user, id]);

  useEffect(() => {
    if (!line || line === "Order not found") return;
    const t: number = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(t);
  }, [line]);

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <h1 className="text-xl font-bold">Packing slip</h1>
      <pre className="mt-4 whitespace-pre-wrap font-sans text-sm">{line}</pre>
    </div>
  );
}
