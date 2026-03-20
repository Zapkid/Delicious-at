import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id: itemId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: itemRow, error: itemErr } = await supabase
    .from("items")
    .select("id, name, shop_id, shops(seller_id)")
    .eq("id", itemId)
    .maybeSingle();

  if (itemErr || !itemRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const shopRel: { seller_id: string } | null = (
    itemRow as { shops: { seller_id: string } | null }
  ).shops;
  if (!shopRel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sellerId: string = shopRel.seller_id;
  if (sellerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const itemName: string = (itemRow as { name: string }).name;

  const admin = createAdminClient();
  const { data: subs, error: subErr } = await admin
    .from("item_subscriptions")
    .select("user_id")
    .eq("item_id", itemId);

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  const userIds: string[] = [
    ...new Set(
      (subs ?? []).map((s: { user_id: string }) => s.user_id)
    ),
  ];

  for (const uid of userIds) {
    await admin.from("notifications").insert({
      user_id: uid,
      type: "item_available",
      title_he: "פריט זמין שוב",
      title_en: "Item available",
      body_he: `${itemName} זמין להזמנה`,
      body_en: `${itemName} is available again`,
      data: { item_id: itemId },
    } as never);
  }

  return NextResponse.json({ ok: true, notified: userIds.length });
}
