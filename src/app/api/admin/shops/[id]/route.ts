import { NextResponse } from "next/server";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/audit-log";

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
    .from("shops")
    .select("*, profiles(full_name, email), items(id, name, base_price, is_available_now), orders(id, status)")
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

export async function PATCH(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const manager: Awaited<ReturnType<typeof getManagerSession>> =
    await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (typeof b.is_active === "boolean") patch.is_active = b.is_active;
  if (b.suspended_at === null) {
    patch.suspended_at = null;
    patch.suspension_reason = null;
  } else if (typeof b.suspended_at === "string") {
    patch.suspended_at = b.suspended_at;
  }
  if (typeof b.suspension_reason === "string") {
    patch.suspension_reason = b.suspension_reason;
  }
  if (typeof b.is_featured === "boolean") patch.is_featured = b.is_featured;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("shops").update(patch as never).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorId: manager.userId,
    action: "shop_patch",
    entity: id,
    payload: patch,
  });

  return NextResponse.json({ ok: true });
}
