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
    .from("seller_applications")
    .select("*, profiles!user_id(full_name, email, avatar_url)")
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

  const rawStatus: unknown = (body as { status?: unknown }).status;
  if (rawStatus !== "approved" && rawStatus !== "rejected") {
    return NextResponse.json(
      { error: "status must be approved or rejected" },
      { status: 400 }
    );
  }

  const status: "approved" | "rejected" = rawStatus;
  const adminNoteRaw: unknown = (body as { admin_note?: unknown }).admin_note;
  const adminNote: string | null =
    typeof adminNoteRaw === "string" && adminNoteRaw.trim() !== ""
      ? adminNoteRaw
      : null;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("seller_applications")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: updateError } = await admin
    .from("seller_applications")
    .update({
      status,
      admin_note: adminNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: manager.userId,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (status === "approved") {
    await admin
      .from("profiles")
      .update({ is_seller_approved: true })
      .eq("id", existing.user_id);
  }

  await writeAdminAuditLog({
    actorId: manager.userId,
    action: "application_decision",
    entity: id,
    payload: { status, admin_note: adminNote },
  });

  return NextResponse.json({ ok: true });
}
