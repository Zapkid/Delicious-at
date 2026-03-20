import { NextResponse } from "next/server";
import { z } from "zod";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/audit-log";

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  status: z.enum(["approved", "rejected"]),
});

export async function POST(request: Request): Promise<NextResponse> {
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

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const status: "approved" | "rejected" = parsed.data.status;

  for (const id of parsed.data.ids) {
    const { data: existing, error: fetchError } = await admin
      .from("seller_applications")
      .select("id, user_id, status")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) continue;

    const row: { user_id: string } = existing as { user_id: string };

    await admin
      .from("seller_applications")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: manager.userId,
      } as never)
      .eq("id", id);

    if (status === "approved") {
      await admin
        .from("profiles")
        .update({ is_seller_approved: true } as never)
        .eq("id", row.user_id);
    }
  }

  await writeAdminAuditLog({
    actorId: manager.userId,
    action: "applications_bulk",
    entity: "seller_applications",
    payload: { ids: parsed.data.ids, status },
  });

  return NextResponse.json({ ok: true });
}
