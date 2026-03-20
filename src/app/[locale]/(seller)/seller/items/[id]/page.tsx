import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { EditItemForm } from "./edit-item-form";
import type { Item, ItemPhoto, ItemPortion, ItemAvailability } from "@/types";

interface EditItemPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditItemPage({
  params,
}: EditItemPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const t = await getTranslations("seller.items");
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  const { data: photos } = await supabase
    .from("item_photos")
    .select("*")
    .eq("item_id", id)
    .order("sort_order");

  const { data: portions } = await supabase
    .from("item_portions")
    .select("*")
    .eq("item_id", id);

  const { data: availability } = await supabase
    .from("item_availability")
    .select("*")
    .eq("item_id", id);

  if (!item) {
    return (
      <>
        <PageHeader title={t("editItem")} showBack />
        <main className="flex flex-col items-center justify-center p-8">
          <p className="text-muted-foreground">{t("itemNotFound")}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("editItem")} showBack />
      <main className="flex flex-col gap-4 p-4">
        <EditItemForm
          item={item as Item}
          photos={(photos ?? []) as ItemPhoto[]}
          portions={(portions ?? []) as ItemPortion[]}
          availability={(availability ?? []) as ItemAvailability[]}
        />
      </main>
    </>
  );
}
