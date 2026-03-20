import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RequestItemButton } from "@/features/orders/request-item-button";
import { ItemFavoriteButton } from "@/features/items/item-favorite-button";
import { ItemSubscribeButton } from "@/features/items/item-subscribe-button";
import type { ItemWithPhotos, Shop, ItemPortion, ItemPhoto } from "@/types";

interface ItemPageProps {
  params: Promise<{ locale: string; id: string }>;
}

interface ItemWithShop extends ItemWithPhotos {
  shops: Shop;
}

export default async function ItemPage({
  params,
}: ItemPageProps): Promise<React.ReactElement> {
  const { locale, id } = await params;
  const t = await getTranslations("item");
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select("*, item_photos(*), item_portions(*), shops(*)")
    .eq("id", id)
    .single();

  if (!item) notFound();

  const typedItem: ItemWithShop = item as unknown as ItemWithShop;
  const photos: ItemPhoto[] = [...typedItem.item_photos].sort(
    (a: ItemPhoto, b: ItemPhoto) => a.sort_order - b.sort_order
  );
  const mainPhoto: string | null = photos[0]?.url ?? null;
  const portions: ItemPortion[] = typedItem.item_portions;

  return (
    <>
      <PageHeader title={typedItem.name} showBack />
      <main className="flex flex-1 flex-col gap-6 pb-8">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={typedItem.name}
            className="aspect-square w-full max-w-md mx-auto object-cover sm:rounded-lg"
          />
        ) : (
          <div className="flex aspect-square w-full max-w-md mx-auto items-center justify-center bg-muted/40 text-6xl sm:rounded-lg">
            🍽️
          </div>
        )}

        <div className="flex flex-col gap-2 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold">{typedItem.name}</h2>
              <p className="text-lg font-semibold text-primary">
                ₪{typedItem.base_price}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <ItemFavoriteButton itemId={typedItem.id} />
              <ItemSubscribeButton itemId={typedItem.id} />
            </div>
          </div>

          {typedItem.shops && (
            <Link
              href={`/${locale}/shop/${typedItem.shops.id}`}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              {typedItem.shops.name}
            </Link>
          )}

          <div className="flex flex-wrap gap-1.5">
            {typedItem.is_vegan && (
              <Badge variant="secondary">{t("vegan")}</Badge>
            )}
            {typedItem.allergens.length > 0 && (
              <Badge variant="outline">
                {t("allergens")}: {typedItem.allergens.join(", ")}
              </Badge>
            )}
            {!typedItem.is_available_now && (
              <Badge variant="destructive">{t("outOfStock")}</Badge>
            )}
          </div>
        </div>

        {typedItem.description && (
          <section className="px-4">
            <p className="text-sm text-muted-foreground">{typedItem.description}</p>
          </section>
        )}

        {portions.length > 0 && (
          <>
            <Separator />
            <section className="px-4">
              <h3 className="mb-2 text-sm font-medium">{t("portions")}</h3>
              <div className="flex flex-wrap gap-2">
                {portions.map((portion: ItemPortion) => (
                  <Badge key={portion.id} variant="outline" className="px-3 py-1.5 text-sm">
                    {portion.label}
                    {portion.price_delta !== 0 && (
                      <span className="ms-1 text-muted-foreground">
                        {portion.price_delta > 0 ? "+" : ""}₪{portion.price_delta}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="px-4 mt-auto">
          <RequestItemButton
            locale={locale}
            itemId={typedItem.id}
            shopId={typedItem.shops.id}
            available={typedItem.is_available_now}
            supportsDelivery={typedItem.shops.supports_delivery}
            portions={portions.map((p: ItemPortion) => ({
              id: p.id,
              label: p.label,
            }))}
          />
        </div>
      </main>
    </>
  );
}
