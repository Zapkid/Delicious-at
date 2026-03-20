"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { useNotifications } from "@/features/notifications/use-notifications";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Json } from "@/lib/supabase/types";
import type { Notification } from "@/types";

function parseNotificationData(data: Json): { orderId?: string } {
  if (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "order_id" in data
  ) {
    const raw: unknown = (data as { order_id?: unknown }).order_id;
    return {
      orderId: typeof raw === "string" ? raw : undefined,
    };
  }
  return {};
}

export function NotificationBell(): React.ReactElement {
  const t = useTranslations("notifications");
  const locale: string = useLocale();
  const [open, setOpen] = useState<boolean>(false);
  const { notifications, unreadCount, markAsRead, isLoading } =
    useNotifications();

  const useHe: boolean = locale === "he";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={t("title")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            notifications.map((n: Notification) => {
              const title: string =
                (useHe ? n.title_he : n.title_en) ??
                n.title_en ??
                n.title_he ??
                "";
              const body: string =
                (useHe ? n.body_he : n.body_en) ??
                n.body_en ??
                n.body_he ??
                "";
              const { orderId } = parseNotificationData(n.data);
              const href: string | null = orderId
                ? `/${locale}/my-requests/${orderId}`
                : null;

              const className: string = cn(
                "block w-full rounded-lg border border-border p-3 text-start text-sm transition-colors hover:bg-muted/50",
                !n.is_read && "border-primary/40 bg-primary/5"
              );

              const content: React.ReactElement = (
                <>
                  <p className="font-medium">{title}</p>
                  {body ? (
                    <p className="mt-1 line-clamp-3 text-muted-foreground">
                      {body}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </>
              );

              return (
                <div key={n.id}>
                  {href ? (
                    <Link
                      href={href}
                      className={className}
                      onClick={() => {
                        void markAsRead(n.id);
                        setOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={className}
                      onClick={() => void markAsRead(n.id)}
                    >
                      {content}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
