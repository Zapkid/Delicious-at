"use client";

import { NextIntlClientProvider } from "next-intl";
import { createEnglishMessageFallbacks } from "@/i18n/english-fallback";

const intlFallbackProps: ReturnType<typeof createEnglishMessageFallbacks> =
  createEnglishMessageFallbacks();

interface IntlProviderWithFallbackProps {
  locale: string;
  messages: Record<string, unknown>;
  children: React.ReactNode;
}

export function IntlProviderWithFallback({
  locale,
  messages,
  children,
}: IntlProviderWithFallbackProps): React.ReactElement {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      {...intlFallbackProps}
    >
      {children}
    </NextIntlClientProvider>
  );
}
