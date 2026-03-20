import type { Json } from "@/lib/supabase/types";

const DAY_KEYS: readonly string[] = ["0", "1", "2", "3", "4", "5", "6"];

const DAY_LABELS_EN: Record<string, string> = {
  "0": "Sun",
  "1": "Mon",
  "2": "Tue",
  "3": "Wed",
  "4": "Thu",
  "5": "Fri",
  "6": "Sat",
};

/**
 * `weekly_hours` is a JSON object keyed by weekday index (0–6) with open/close strings or ranges.
 */
export function summarizeWeeklyHours(
  weeklyHours: Json,
  locale: string
): string[] {
  if (
    weeklyHours === null ||
    typeof weeklyHours !== "object" ||
    Array.isArray(weeklyHours)
  ) {
    return [];
  }

  const labels: Record<string, string> =
    locale === "he"
      ? {
          "0": "א׳",
          "1": "ב׳",
          "2": "ג׳",
          "3": "ד׳",
          "4": "ה׳",
          "5": "ו׳",
          "6": "ש׳",
        }
      : DAY_LABELS_EN;

  const lines: string[] = [];
  const obj: Record<string, unknown> = weeklyHours as Record<string, unknown>;

  for (const key of DAY_KEYS) {
    const v: unknown = obj[key];
    if (v === undefined || v === null) continue;
    const label: string = labels[key] ?? key;
    if (typeof v === "string") {
      lines.push(`${label}: ${v}`);
    } else if (typeof v === "object" && v !== null && "open" in v && "close" in v) {
      const open: unknown = (v as { open?: unknown }).open;
      const close: unknown = (v as { close?: unknown }).close;
      lines.push(`${label}: ${String(open)}–${String(close)}`);
    }
  }

  return lines;
}
