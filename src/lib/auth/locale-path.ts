import { routing } from "@/i18n/routing";

const GUEST_PUBLIC_ROOTS: readonly string[] = [
  "login",
  "explore",
  "shop",
  "item",
];

export type ParsedLocalePath = {
  locale: string;
  /** Path after `/{locale}`, e.g. `/home` or `` for `/{locale}` only */
  rest: string;
};

export function parseLocalePath(pathname: string): ParsedLocalePath | null {
  const segments: string[] = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  const loc: string = segments[0] ?? "";
  if (
    !routing.locales.includes(loc as (typeof routing.locales)[number])
  ) {
    return null;
  }
  const rest: string =
    segments.length > 1 ? `/${segments.slice(1).join("/")}` : "";
  return { locale: loc, rest };
}

/** Routes a signed-out user may open without being sent to login */
export function isGuestPublicRest(rest: string): boolean {
  const first: string = rest.replace(/^\//, "").split("/")[0] ?? "";
  return GUEST_PUBLIC_ROOTS.includes(first);
}
