import { NextResponse } from "next/server";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(): Promise<NextResponse> {
  const manager: Awaited<ReturnType<typeof getManagerSession>> =
    await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Omit suspended_at so this route works before moderation migration (007);
  // stats only need id, is_active, and nested items.
  const { data: shops, error: shopsErr } = await admin
    .from("shops")
    .select("id, is_active, items(id)")
    .eq("is_active", true);

  if (shopsErr) {
    return NextResponse.json({ error: shopsErr.message }, { status: 500 });
  }

  const rows: { id: string; items: { id: string }[] | null }[] =
    (shops ?? []) as { id: string; items: { id: string }[] | null }[];

  const zeroItems: number = rows.filter(
    (s: { id: string; items: { id: string }[] | null }): boolean =>
      !s.items || s.items.length === 0
  ).length;

  const thirtyDaysAgo: string = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentOrders, error: ordErr } = await admin
    .from("orders")
    .select("shop_id")
    .gte("created_at", thirtyDaysAgo);

  if (ordErr) {
    return NextResponse.json({ error: ordErr.message }, { status: 500 });
  }

  const activeShopIds: Set<string> = new Set(rows.map((s) => s.id));
  const shopsWithRecent: Set<string> = new Set(
    (recentOrders ?? []).map((o: { shop_id: string }) => o.shop_id)
  );

  let inactiveWithShop: number = 0;
  for (const id of activeShopIds) {
    if (!shopsWithRecent.has(id)) inactiveWithShop += 1;
  }

  return NextResponse.json({
    activeShopCount: rows.length,
    activeShopsWithZeroItems: zeroItems,
    activeShopsWithoutOrdersLast30Days: inactiveWithShop,
  });
}
