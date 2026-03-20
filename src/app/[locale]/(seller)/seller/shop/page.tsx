"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import type { Shop, SellerPaymentMethod } from "@/types";

const PAYMENT_METHODS = ["bit", "paybox", "cash", "other"] as const;

export default function SellerShopPage(): React.ReactElement {
  const t = useTranslations("seller.shop");
  const { user } = useUser();
  const supabase = useSupabase();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState<string>("");
  const [tagline, setTagline] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [supportsDelivery, setSupportsDelivery] = useState<boolean>(false);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<string>("");
  const [deliveryEstMinutes, setDeliveryEstMinutes] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<string>("");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState<boolean>(false);
  const [uploadingProfile, setUploadingProfile] = useState<boolean>(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [paymentMethods, setPaymentMethods] = useState<
    Record<string, boolean>
  >({
    bit: false,
    paybox: false,
    cash: false,
    other: false,
  });
  const [saveFailed, setSaveFailed] = useState<boolean>(false);
  const [uploadFailed, setUploadFailed] = useState<boolean>(false);

  const fetchShop = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }

    setShop(null);
    setCoverPhotoUrl(null);
    setProfilePhotoUrl(null);

    const { data: shopRow, error: shopError } = await supabase
      .from("shops")
      .select("*")
      .eq("seller_id", user.id)
      .maybeSingle();

    if (shopError) {
      console.error("[seller shop] load shop:", shopError.message);
      setLoading(false);
      return;
    }

    const shopData: Shop | null = shopRow as Shop | null;
    if (shopData) {
      setShop(shopData);
      setName(shopData.name);
      setTagline(shopData.tagline ?? "");
      setDescription(shopData.description ?? "");
      setCoverPhotoUrl(shopData.cover_photo_url ?? null);
      setProfilePhotoUrl(shopData.profile_photo_url ?? null);
      setSupportsDelivery(shopData.supports_delivery);
      setDeliveryRadiusKm(shopData.delivery_radius_km?.toString() ?? "");
      setDeliveryEstMinutes(shopData.delivery_est_minutes?.toString() ?? "");
      setDeliveryFee(shopData.delivery_fee?.toString() ?? "0");
      setDeliveryNotes(shopData.delivery_notes ?? "");

      const { data: methods } = await supabase
        .from("seller_payment_methods")
        .select("*")
        .eq("shop_id", shopData.id);

      const methodMap: Record<string, boolean> = {
        bit: false,
        paybox: false,
        cash: false,
        other: false,
      };
      ((methods ?? []) as SellerPaymentMethod[]).forEach(
        (m: SellerPaymentMethod) => {
          methodMap[m.method] = m.is_enabled;
        }
      );
      setPaymentMethods(methodMap);
    } else {
      setName("");
      setTagline("");
      setDescription("");
      setSupportsDelivery(false);
      setDeliveryRadiusKm("");
      setDeliveryEstMinutes("");
      setDeliveryFee("");
      setDeliveryNotes("");
      setPaymentMethods({
        bit: false,
        paybox: false,
        cash: false,
        other: false,
      });

      const { data: appRow } = await supabase
        .from("seller_applications")
        .select("business_name, bio")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .order("reviewed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const app: { business_name: string; bio: string | null } | null =
        appRow as { business_name: string; bio: string | null } | null;
      if (app) {
        setName(app.business_name);
        setDescription(app.bio ?? "");
      }
    }

    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  async function handleImageUpload(
    file: File,
    type: "cover" | "profile"
  ): Promise<void> {
    if (!shop) return;
    const setUploading = type === "cover" ? setUploadingCover : setUploadingProfile;
    const setUrl = type === "cover" ? setCoverPhotoUrl : setProfilePhotoUrl;
    const column = type === "cover" ? "cover_photo_url" : "profile_photo_url";

    setUploading(true);
    setUploadFailed(false);
    const ext: string = file.name.split(".").pop() ?? "jpg";
    const path: string = `shops/${shop.id}/${type}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("shop-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("[seller shop] storage upload:", uploadError.message);
      setUploadFailed(true);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("shop-images")
      .getPublicUrl(path);

    const publicUrl: string = urlData.publicUrl;
    const { error: dbError } = await supabase
      .from("shops")
      .update({ [column]: publicUrl } as never)
      .eq("id", shop.id);

    if (dbError) {
      console.error("[seller shop] save image url:", dbError.message);
      setUploadFailed(true);
      setUploading(false);
      return;
    }

    setUrl(publicUrl);
    setUploading(false);
  }

  async function handleSave(): Promise<void> {
    if (!user) return;
    const trimmedName: string = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    setSaveFailed(false);

    let shopId: string;

    if (shop === null) {
      const { data: inserted, error: insertError } = await supabase
        .from("shops")
        .insert({
          seller_id: user.id,
          name: trimmedName,
          tagline: tagline || null,
          description: description || null,
          supports_delivery: supportsDelivery,
          delivery_radius_km: supportsDelivery
            ? Number(deliveryRadiusKm) || null
            : null,
          delivery_est_minutes: supportsDelivery
            ? Number(deliveryEstMinutes) || null
            : null,
          delivery_fee: supportsDelivery ? Number(deliveryFee) || 0 : 0,
          delivery_notes: supportsDelivery ? deliveryNotes || null : null,
        } as never)
        .select("*")
        .single();

      if (insertError || !inserted) {
        console.error("[seller shop] insert shop:", insertError?.message);
        setSaveFailed(true);
        setSaving(false);
        return;
      }

      const created: Shop = inserted as Shop;
      setShop(created);
      shopId = created.id;
    } else {
      const { error: updateError } = await supabase
        .from("shops")
        .update({
          name: trimmedName,
          tagline: tagline || null,
          description: description || null,
          supports_delivery: supportsDelivery,
          delivery_radius_km: supportsDelivery
            ? Number(deliveryRadiusKm) || null
            : null,
          delivery_est_minutes: supportsDelivery
            ? Number(deliveryEstMinutes) || null
            : null,
          delivery_fee: supportsDelivery ? Number(deliveryFee) || 0 : 0,
          delivery_notes: supportsDelivery ? deliveryNotes || null : null,
        } as never)
        .eq("id", shop.id);

      if (updateError) {
        console.error("[seller shop] update shop:", updateError.message);
        setSaveFailed(true);
        setSaving(false);
        return;
      }

      shopId = shop.id;
    }

    for (const method of PAYMENT_METHODS) {
      const { data: existingRow } = await supabase
        .from("seller_payment_methods")
        .select("id")
        .eq("shop_id", shopId)
        .eq("method", method)
        .maybeSingle();

      const existing = existingRow as { id: string } | null;

      if (existing) {
        await supabase
          .from("seller_payment_methods")
          .update({ is_enabled: paymentMethods[method] } as never)
          .eq("id", existing.id);
      } else if (paymentMethods[method]) {
        await supabase
          .from("seller_payment_methods")
          .insert({ shop_id: shopId, method, is_enabled: true } as never);
      }
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <>
        <PageHeader title={t("title")} />
        <main className="flex flex-col gap-4 p-4">
          <Card>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-col gap-6 p-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("shopDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("shopName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("shopName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">{t("tagline")}</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder={t("tagline")}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("shopImages")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!shop ? (
              <p className="text-sm text-muted-foreground">
                {t("saveFirstForImages")}
              </p>
            ) : null}
            {uploadFailed ? (
              <p className="text-sm text-destructive" role="alert">
                {t("uploadFailed")}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label>{t("coverPhoto")}</Label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file: File | undefined = e.target.files?.[0];
                  if (file) void handleImageUpload(file, "cover");
                }}
              />
              {coverPhotoUrl ? (
                <div className="relative">
                  <img
                    src={coverPhotoUrl}
                    alt=""
                    className="h-40 w-full rounded-lg object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 end-2"
                    disabled={uploadingCover || shop === null}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploadingCover ? t("saving") : t("changeImage")}
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploadingCover || shop === null}
                  onClick={() => coverInputRef.current?.click()}
                  className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary hover:bg-muted/30 disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-sm">
                      {uploadingCover ? t("saving") : t("uploadImage")}
                    </span>
                  </div>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("profilePhoto")}</Label>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file: File | undefined = e.target.files?.[0];
                  if (file) void handleImageUpload(file, "profile");
                }}
              />
              <div className="flex items-center gap-4">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploadingProfile || shop === null}
                  onClick={() => profileInputRef.current?.click()}
                >
                  {uploadingProfile
                    ? t("saving")
                    : profilePhotoUrl
                      ? t("changeImage")
                      : t("uploadImage")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("delivery")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="delivery"
                checked={supportsDelivery}
                onCheckedChange={setSupportsDelivery}
              />
              <Label htmlFor="delivery">{t("deliveryToggle")}</Label>
            </div>
            {supportsDelivery && (
              <>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="radius">{t("deliveryRadius")}</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={deliveryRadiusKm}
                      onChange={(e) => setDeliveryRadiusKm(e.target.value)}
                      placeholder="5"
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="est">{t("deliveryTime")}</Label>
                    <Input
                      id="est"
                      type="number"
                      value={deliveryEstMinutes}
                      onChange={(e) => setDeliveryEstMinutes(e.target.value)}
                      placeholder="30"
                      min={0}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">{t("deliveryFee")}</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="0"
                    min={0}
                    step={0.5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("deliveryNotes")}</Label>
                  <Textarea
                    id="notes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder={t("deliveryNotes")}
                    rows={2}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("paymentMethods")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <div key={method} className="flex items-center gap-3">
                <Checkbox
                  id={method}
                  checked={paymentMethods[method]}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setPaymentMethods((prev) => ({
                      ...prev,
                      [method]: checked === true,
                    }))
                  }
                />
                <Label htmlFor={method}>{t(method)}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {saveFailed ? (
          <p className="text-sm text-destructive" role="alert">
            {t("saveFailed")}
          </p>
        ) : null}

        <Button
          onClick={() => void handleSave()}
          disabled={saving || !name.trim()}
          className="w-full sm:w-auto sm:self-end"
        >
          {saving ? t("saving") : t("save")}
        </Button>
      </main>
    </>
  );
}
