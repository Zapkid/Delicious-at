"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ImagePlus, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";

interface PhotoPreview {
  file: File;
  preview: string;
}

export default function NewItemPage(): React.ReactElement {
  const t = useTranslations("seller.items");
  const locale: string = useLocale();
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const supabase = useSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shopId, setShopId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [basePrice, setBasePrice] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [isVegan, setIsVegan] = useState<boolean>(false);
  const [allergens, setAllergens] = useState<string>("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [shopResolved, setShopResolved] = useState<boolean>(false);

  const fetchShop = useCallback(async (): Promise<void> => {
    if (authLoading) return;
    setShopResolved(false);
    if (!user) {
      setShopResolved(true);
      return;
    }
    const { data: shopRow } = await supabase
      .from("shops")
      .select("id")
      .eq("seller_id", user.id)
      .maybeSingle();
    const shop = shopRow as { id: string } | null;
    if (shop?.id) setShopId(shop.id);
    else setShopId("");
    setShopResolved(true);
  }, [user, supabase, authLoading]);

  useEffect(() => {
    void fetchShop();
  }, [fetchShop]);

  useEffect(() => {
    return () => {
      photos.forEach((p: PhotoPreview) => URL.revokeObjectURL(p.preview));
    };
  }, [photos]);

  function handlePhotosSelected(e: React.ChangeEvent<HTMLInputElement>): void {
    const files: FileList | null = e.target.files;
    if (!files) return;

    const remaining: number = 5 - photos.length;
    const newPhotos: PhotoPreview[] = Array.from(files)
      .slice(0, remaining)
      .map((file: File) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setPhotos((prev: PhotoPreview[]) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number): void {
    setPhotos((prev: PhotoPreview[]) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_: PhotoPreview, i: number) => i !== index);
    });
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    if (!shopId || !name.trim() || !basePrice) return;

    setSaving(true);

    const { data: itemRow, error } = await supabase
      .from("items")
      .insert({
        shop_id: shopId,
        name: name.trim(),
        description: description.trim() || null,
        base_price: Number(basePrice),
        stock: stock ? Number(stock) : null,
        is_vegan: isVegan,
        allergens: allergens
          .split(",")
          .map((a: string) => a.trim())
          .filter(Boolean),
      } as never)
      .select("id")
      .single();

    const item = itemRow as { id: string } | null;

    if (!error && item) {
      for (let i = 0; i < photos.length; i++) {
        const photo: PhotoPreview = photos[i];
        const ext: string = photo.file.name.split(".").pop() ?? "jpg";
        const path: string = `items/${item.id}/${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(path, photo.file, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("item-images")
            .getPublicUrl(path);

          await supabase.from("item_photos").insert({
            item_id: item.id,
            url: urlData.publicUrl,
            sort_order: i,
          } as never);
        }
      }

      router.push(`/${locale}/seller/items`);
    }

    setSaving(false);
  }

  return (
    <>
      <PageHeader title={t("newItem")} showBack />
      <main className="flex flex-col gap-4 p-4">
        {shopResolved && !shopId && user ? (
          <div
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-foreground"
            role="status"
          >
            <p className="font-medium">{t("needShopFirstTitle")}</p>
            <p className="mt-1 text-muted-foreground">{t("needShopFirstBody")}</p>
            <Button asChild variant="secondary" className="mt-3 w-full sm:w-auto">
              <Link href={`/${locale}/seller/shop`}>{t("setupShop")}</Link>
            </Button>
          </div>
        ) : null}
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("name")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("description")}
                  rows={4}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">{t("basePrice")}</Label>
                  <Input
                    id="price"
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0"
                    min={0}
                    step={0.01}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">{t("stock")}</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    min={0}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="vegan"
                  checked={isVegan}
                  onCheckedChange={setIsVegan}
                />
                <Label htmlFor="vegan">{t("vegan")}</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergens">{t("allergens")}</Label>
                <Input
                  id="allergens"
                  value={allergens}
                  onChange={(e) => setAllergens(e.target.value)}
                  placeholder={t("allergensPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("photos")}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotosSelected}
                />
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {photos.map((photo: PhotoPreview, i: number) => (
                    <div key={photo.preview} className="group relative">
                      <img
                        src={photo.preview}
                        alt=""
                        className="h-24 w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -end-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary hover:bg-muted/30"
                    >
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-[10px]">{t("addPhotos")}</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  saving ||
                  authLoading ||
                  !shopResolved ||
                  !shopId ||
                  !name.trim() ||
                  !basePrice
                }
                className="w-full"
              >
                {authLoading || !shopResolved
                  ? t("checkingShop")
                  : saving
                    ? t("saving")
                    : t("createItem")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
