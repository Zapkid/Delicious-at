import { NextResponse } from "next/server";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const manager: Awaited<ReturnType<typeof getManagerSession>> =
    await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "*, items(name, base_price), shops(name, seller_id), order_messages(body, created_at, sender_id)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
