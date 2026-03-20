import { IntlErrorCode, type IntlError } from "use-intl/core";
import enMessages from "../../messages/en.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function messageFromEnglishTree(
  namespace: string | undefined,
  key: string
): string | undefined {
  const segments: string[] = [];
  if (namespace) segments.push(...namespace.split("."));
  segments.push(...key.split("."));
  let current: unknown = enMessages;
  for (const segment of segments) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return typeof current === "string" ? current : undefined;
}

export function createEnglishMessageFallbacks(): {
  getMessageFallback: (info: {
    error: IntlError;
    key: string;
    namespace?: string;
  }) => string;
  onError: (error: IntlError) => void;
} {
  return {
    getMessageFallback({ error, key, namespace }): string {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        const fromEn: string | undefined = messageFromEnglishTree(namespace, key);
        if (fromEn !== undefined) return fromEn;
      }
      return [namespace, key].filter(Boolean).join(".");
    },
    onError(error: IntlError): void {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) return;
      console.error(error);
    },
  };
}
