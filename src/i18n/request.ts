import { getRequestConfig } from "next-intl/server";
import { createEnglishMessageFallbacks } from "./english-fallback";
import { loadLocaleMessages } from "./load-messages";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale: string | undefined = await requestLocale;

  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: await loadLocaleMessages(locale),
    ...createEnglishMessageFallbacks(),
  };
});
