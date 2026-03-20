import { NextResponse } from "next/server";
import { getManagerSession } from "@/lib/admin/manager-session";
import { runMonthlyFeeAggregationForPreviousMonth } from "@/lib/admin/run-monthly-fee-aggregation";
import { writeAdminAuditLog } from "@/lib/admin/audit-log";

export async function POST(): Promise<NextResponse> {
  const manager: Awaited<ReturnType<typeof getManagerSession>> =
    await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result: Awaited<
      ReturnType<typeof runMonthlyFeeAggregationForPreviousMonth>
    > = await runMonthlyFeeAggregationForPreviousMonth();
    await writeAdminAuditLog({
      actorId: manager.userId,
      action: "monthly_fees_run",
      entity: "seller_monthly_fees",
      payload: result,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg: string = e instanceof Error ? e.message : "Aggregation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
