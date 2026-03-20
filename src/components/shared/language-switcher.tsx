"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { LOCALES, type Locale } from "@/lib/constants";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  he: "עברית",
  es: "Español",
  ru: "Русский",
  ar: "العربية",
  pt: "Português (PT)",
  "pt-BR": "Português (BR)",
  tl: "Filipino",
} as const;

const SWITCHER_LOCALES: readonly Locale[] = LOCALES;

type LanguageSwitcherProps = {
  defaultPathWhenEmpty: string;
};

function pathWithoutLocalePrefix(
  pathname: string,
  fallback: string
): string {
  const segments: string[] = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return fallback;
  }
  const first: string = segments[0] ?? "";
  if (!LOCALES.includes(first as Locale)) {
    return pathname.startsWith("/") ? pathname : `/${pathname}`;
  }
  if (segments.length === 1) {
    return fallback;
  }
  return `/${segments.slice(1).join("/")}`;
}

export function LanguageSwitcher({
  defaultPathWhenEmpty,
}: LanguageSwitcherProps): React.ReactElement {
  const pathname: string = usePathname();
  const locale: string = useLocale();
  const rest: string = pathWithoutLocalePrefix(pathname, defaultPathWhenEmpty);

  return (
    <div className="flex flex-wrap gap-2">
      {SWITCHER_LOCALES.map((code: Locale) => (
        <Link
          key={code}
          href={`/${code}${rest}`}
          prefetch={false}
          className={`rounded-lg px-3 py-2 text-sm ${
            locale === code ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {LOCALE_LABELS[code]}
        </Link>
      ))}
    </div>
  );
}
