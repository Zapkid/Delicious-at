"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { isRtl } from "@/i18n/config";
import type { Locale } from "@/lib/constants";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  showBack = false,
  actions,
}: PageHeaderProps): React.ReactElement {
  const router = useRouter();
  const locale: string = useLocale();
  const rtl: boolean = isRtl(locale as Locale);
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="rounded-md p-1.5 transition-colors hover:bg-muted"
          >
            <BackIcon className="h-5 w-5" />
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
