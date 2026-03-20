import { createAdminClient } from "@/lib/supabase/admin";

export async function writeAdminAuditLog(params: {
  actorId: string;
  action: string;
  entity: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("admin_audit_log").insert({
    actor_id: params.actorId,
    action: params.action,
    entity: params.entity,
    payload: params.payload ?? {},
  } as never);
}
