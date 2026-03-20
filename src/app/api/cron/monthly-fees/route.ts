import { NextResponse } from "next/server";
import { runMonthlyFeeAggregationForPreviousMonth } from "@/lib/admin/run-monthly-fee-aggregation";

export async function POST(request: Request): Promise<NextResponse> {
  const secret: string | undefined = process.env.CRON_SECRET;
  const auth: string | null = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result: Awaited<
      ReturnType<typeof runMonthlyFeeAggregationForPreviousMonth>
    > = await runMonthlyFeeAggregationForPreviousMonth();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg: string = e instanceof Error ? e.message : "Aggregation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
