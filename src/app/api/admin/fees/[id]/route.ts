import { NextResponse } from "next/server";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/audit-log";

interface RouteParams {
  params: Promise<{ id: string }>;
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

  const status: unknown =
    typeof body === "object" && body !== null
      ? (body as { status?: unknown }).status
      : undefined;
  if (status !== "paid") {
    return NextResponse.json({ error: "status must be paid" }, { status: 400 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("seller_monthly_fees")
    .update({ status: "paid" } as never)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorId: manager.userId,
    action: "fee_mark_paid",
    entity: id,
    payload: {},
  });

  return NextResponse.json({ ok: true });
}
