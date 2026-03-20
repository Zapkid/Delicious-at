import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/constants";

export const locales: readonly Locale[] = LOCALES;
export const defaultLocale: Locale = DEFAULT_LOCALE;

export function isRtl(locale: Locale): boolean {
  return locale === "he" || locale === "ar";
}
