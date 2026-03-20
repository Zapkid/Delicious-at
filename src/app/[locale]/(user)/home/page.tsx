"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useUser } from "@/hooks/use-user";
import { useAvailableItems } from "@/hooks/use-available-items";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Item } from "@/types";

function ItemCardSkeleton(): React.ReactElement {
  return (
    <Card className="w-44 shrink-0 gap-0 py-0 overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <CardContent className="p-3">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

export default function HomePage(): React.ReactElement {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");
  const locale: string = useLocale();
  const { profile } = useUser();
  const { items, isLoading } = useAvailableItems();
  const name: string = profile?.full_name ?? "there";

  return (
    <>
      <PageHeader title={t("greeting", { name })} />
      <main className="flex flex-1 flex-col gap-6 p-4">
        <section>
          <h2 className="mb-3 text-base font-semibold">
            {t("availableNow")}
          </h2>

          {isLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i: number) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("emptyState")}
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {items.map((item: Item) => (
                <Link
                  key={item.id}
                  href={`/${locale}/item/${item.id}`}
                  className="shrink-0"
                >
                  <Card className="w-44 gap-0 py-0 overflow-hidden transition-shadow hover:shadow-md">
                    <div className="flex h-28 items-center justify-center bg-muted/40 text-3xl">
                      🍽️
                    </div>
                    <CardContent className="p-3">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ₪{item.base_price}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <Link href={`/${locale}/explore`}>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              size="lg"
            >
              <Search className="h-4 w-4" />
              {tNav("explore")}
            </Button>
          </Link>
        </section>
      </main>
    </>
  );
}
