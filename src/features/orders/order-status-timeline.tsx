"use client";

import { useTranslations } from "next-intl";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const HAPPY_PATH: readonly Order["status"][] = [
  "requested",
  "accepted",
  "paid",
  "delivered",
] as const;

interface OrderStatusTimelineProps {
  status: Order["status"];
}

export function OrderStatusTimeline({
  status,
}: OrderStatusTimelineProps): React.ReactElement {
  const t = useTranslations("order");

  const isTerminalNegative: boolean =
    status === "rejected" || status === "cancelled";

  function stepIndex(s: Order["status"]): number {
    const i: number = HAPPY_PATH.indexOf(s);
    return i >= 0 ? i : -1;
  }

  const currentIdx: number = stepIndex(status);

  return (
    <div className="rounded-lg border border-border bg-muted/10 p-4">
      <h3 className="mb-3 text-sm font-semibold">{t("timelineTitle")}</h3>
      {isTerminalNegative ? (
        <p className="text-sm text-destructive">{t(`status.${status}`)}</p>
      ) : (
        <ul className="space-y-3">
          {HAPPY_PATH.map((step: Order["status"], i: number) => {
            const done: boolean = currentIdx >= i;
            const active: boolean = currentIdx === i;
            return (
              <li key={step} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </span>
                <p
                  className={cn(
                    "text-sm font-medium",
                    active ? "text-primary" : "text-foreground"
                  )}
                >
                  {t(`status.${step}`)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
