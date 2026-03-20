import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { IntlProviderWithFallback } from "@/components/shared/intl-provider-with-fallback";
import { loadLocaleMessages } from "@/i18n/load-messages";
import { routing } from "@/i18n/routing";
import { isRtl } from "@/i18n/config";
import type { Locale } from "@/lib/constants";
import { AuthListener } from "@/features/auth/auth-listener";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<React.ReactElement> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages: Record<string, unknown> = await loadLocaleMessages(locale);

  const dir: "rtl" | "ltr" = isRtl(locale as Locale) ? "rtl" : "ltr";

  return (
    <div lang={locale} dir={dir}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <IntlProviderWithFallback locale={locale} messages={messages}>
          <AuthListener />
          {children}
        </IntlProviderWithFallback>
      </ThemeProvider>
    </div>
  );
}
