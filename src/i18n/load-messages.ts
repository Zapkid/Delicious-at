type MessageTree = Record<string, unknown>;

function isPlainObject(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Prefer `preferred`; fill gaps from `fallback` (deep). */
function mergeMessages(fallback: MessageTree, preferred: MessageTree): MessageTree {
  const result: MessageTree = { ...fallback };
  for (const key of Object.keys(preferred)) {
    const p: unknown = preferred[key];
    const f: unknown = fallback[key];
    if (isPlainObject(p) && isPlainObject(f)) {
      result[key] = mergeMessages(f, p);
    } else {
      result[key] = p;
    }
  }
  return result;
}

/**
 * Loads locale messages with English as fallback for missing keys
 * (avoids MISSING_MESSAGE when a locale file lags behind `en.json`).
 */
export async function loadLocaleMessages(locale: string): Promise<MessageTree> {
  const preferredModule: { default: MessageTree } = await import(
    `../../messages/${locale}.json`
  );
  const preferred: MessageTree = preferredModule.default;
  if (locale === "en") {
    return preferred;
  }
  const enModule: { default: MessageTree } = await import(`../../messages/en.json`);
  return mergeMessages(enModule.default, preferred);
}
