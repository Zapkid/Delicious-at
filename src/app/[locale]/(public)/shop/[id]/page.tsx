import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ShopWithItems, ItemWithPhotos } from "@/types";
import { summarizeWeeklyHours } from "@/lib/format-weekly-hours";

interface ShopPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ShopPage({
  params,
}: ShopPageProps): Promise<React.ReactElement> {
  const { locale, id } = await params;
  const t = await getTranslations("shop");
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("*, items(*, item_photos(*), item_portions(*)), seller_payment_methods(*)")
    .eq("id", id)
    .single();

  if (!shop) notFound();

  const typedShop: ShopWithItems = shop as unknown as ShopWithItems;
  const hoursLines: string[] = summarizeWeeklyHours(
    typedShop.weekly_hours,
    locale
  );
  const available: ItemWithPhotos[] = typedShop.items.filter((i: ItemWithPhotos) => i.is_available_now);
  const other: ItemWithPhotos[] = typedShop.items.filter((i: ItemWithPhotos) => !i.is_available_now);

  function coverPhoto(item: ItemWithPhotos): string | null {
    const sorted = [...item.item_photos].sort((a, b) => a.sort_order - b.sort_order);
    return sorted[0]?.url ?? null;
  }

  return (
    <>
      <PageHeader title={typedShop.name} showBack />
      <main className="flex flex-1 flex-col gap-6 pb-8">
        {typedShop.cover_photo_url ? (
          <img
            src={typedShop.cover_photo_url}
            alt={typedShop.name}
            className="h-40 w-full object-cover sm:h-52"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-muted/40 text-5xl sm:h-52">
            🏪
          </div>
        )}

        <div className="flex flex-col gap-2 px-4">
          <h2 className="text-xl font-bold">{typedShop.name}</h2>
          {typedShop.tagline && (
            <p className="text-sm text-muted-foreground">{typedShop.tagline}</p>
          )}
          {typedShop.description && (
            <p className="text-sm text-muted-foreground">{typedShop.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {typedShop.supports_delivery ? t("pickupAndDelivery") : t("pickupOnly")}
            </Badge>
            {typedShop.supports_delivery && typedShop.delivery_fee > 0 && (
              <Badge variant="outline">
                {t("deliveryFee", { fee: typedShop.delivery_fee })}
              </Badge>
            )}
            {typedShop.supports_delivery &&
              typedShop.delivery_est_minutes != null && (
                <Badge variant="outline">
                  {t("deliveryTime", {
                    minutes: typedShop.delivery_est_minutes,
                  })}
                </Badge>
              )}
            {typedShop.supports_delivery &&
              typedShop.delivery_radius_km != null && (
                <Badge variant="outline">
                  {t("deliveryRadius", {
                    km: String(typedShop.delivery_radius_km),
                  })}
                </Badge>
              )}
          </div>
        </div>

        {hoursLines.length > 0 && (
          <section className="px-4">
            <h3 className="mb-2 text-sm font-semibold">{t("hours")}</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {hoursLines.map((line: string) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        <Separator />

        <section className="px-4">
          <h3 className="mb-3 text-base font-semibold">{t("available")}</h3>
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="space-y-2">
              {available.map((item: ItemWithPhotos) => {
                const photoUrl: string | null = coverPhoto(item);
                return (
                  <Link key={item.id} href={`/${locale}/item/${item.id}`}>
                    <Card className="flex-row items-center gap-0 py-0 overflow-hidden transition-shadow hover:shadow-md">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={item.name}
                          className="h-16 w-16 shrink-0 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-muted/40 text-xl">
                          🍽️
                        </div>
                      )}
                      <CardContent className="flex flex-1 items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          {item.description && (
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          ₪{item.base_price}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {other.length > 0 && (
          <>
            <Separator />
            <section className="px-4">
              <h3 className="mb-3 text-base font-semibold">{t("offline")}</h3>
              <div className="space-y-2">
                {other.map((item: ItemWithPhotos) => {
                  const photoUrl: string | null = coverPhoto(item);
                  return (
                    <Link key={item.id} href={`/${locale}/item/${item.id}`}>
                      <Card className="flex-row items-center gap-0 py-0 overflow-hidden opacity-60">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={item.name}
                            className="h-16 w-16 shrink-0 object-cover grayscale"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-muted/40 text-xl">
                            🍽️
                          </div>
                        )}
                        <CardContent className="flex flex-1 items-center justify-between p-3">
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold">
                            ₪{item.base_price}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
