"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Trash2, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSupabase } from "@/hooks/use-supabase";
import type { Item, ItemPhoto, ItemPortion, ItemAvailability } from "@/types";

interface EditItemFormProps {
  item: Item;
  photos: ItemPhoto[];
  portions: ItemPortion[];
  availability: ItemAvailability[];
}

export function EditItemForm({
  item,
  photos,
  portions: initialPortions,
  availability: initialAvailability,
}: EditItemFormProps): React.ReactElement {
  const t = useTranslations("seller.items");
  const tDash = useTranslations("seller.dashboard");
  const locale: string = useLocale();
  const router = useRouter();
  const supabase = useSupabase();

  const [name, setName] = useState<string>(item.name);
  const [description, setDescription] = useState<string>(
    item.description ?? ""
  );
  const [basePrice, setBasePrice] = useState<string>(String(item.base_price));
  const [stock, setStock] = useState<string>(item.stock?.toString() ?? "");
  const [isVegan, setIsVegan] = useState<boolean>(item.is_vegan);
  const [allergens, setAllergens] = useState<string>(
    item.allergens?.join(", ") ?? ""
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [isAvailableNow, setIsAvailableNow] = useState<boolean>(
    item.is_available_now
  );
  const [slots, setSlots] = useState<ItemAvailability[]>(initialAvailability);
  const [newDay, setNewDay] = useState<string>("1");
  const [newStart, setNewStart] = useState<string>("09:00");
  const [newEnd, setNewEnd] = useState<string>("17:00");
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);

  const [portions, setPortions] = useState<ItemPortion[]>(initialPortions);
  const [newPortionLabel, setNewPortionLabel] = useState<string>("");
  const [newPortionDelta, setNewPortionDelta] = useState<string>("");

  async function handleSave(): Promise<void> {
    if (!name.trim() || !basePrice) return;
    setSaving(true);

    await supabase
      .from("items")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        base_price: Number(basePrice),
        stock: stock ? Number(stock) : null,
        is_vegan: isVegan,
        is_available_now: isAvailableNow,
        allergens: allergens
          .split(",")
          .map((a: string) => a.trim())
          .filter(Boolean),
      } as never)
      .eq("id", item.id);

    setSaving(false);
    router.push(`/${locale}/seller/items`);
  }

  async function handleAddSlot(): Promise<void> {
    const dow: number = Number(newDay);
    if (Number.isNaN(dow) || dow < 0 || dow > 6) return;
    const { data } = await supabase
      .from("item_availability")
      .insert({
        item_id: item.id,
        type: "daily",
        day_of_week: dow,
        start_time: newStart || null,
        end_time: newEnd || null,
      } as never)
      .select()
      .single();
    if (data) {
      setSlots((prev: ItemAvailability[]) => [
        ...prev,
        data as ItemAvailability,
      ]);
    }
  }

  async function handleDeleteSlot(slotId: string): Promise<void> {
    await supabase.from("item_availability").delete().eq("id", slotId);
    setSlots((prev: ItemAvailability[]) =>
      prev.filter((s: ItemAvailability) => s.id !== slotId)
    );
  }

  async function handleNotifySubscribers(): Promise<void> {
    setNotifyMsg(null);
    const res: Response = await fetch(
      `/api/seller/items/${item.id}/notify-subscribers`,
      { method: "POST" }
    );
    if (res.ok) {
      setNotifyMsg(tDash("notifySent"));
    } else {
      setNotifyMsg(tDash("notifyFailed"));
    }
  }

  async function handleAddPortion(): Promise<void> {
    if (!newPortionLabel.trim()) return;

    const { data } = await supabase
      .from("item_portions")
      .insert({
        item_id: item.id,
        label: newPortionLabel.trim(),
        price_delta: Number(newPortionDelta) || 0,
      } as never)
      .select()
      .single();

    if (data) {
      setPortions((prev) => [...prev, data as ItemPortion]);
      setNewPortionLabel("");
      setNewPortionDelta("");
    }
  }

  async function handleDeletePortion(portionId: string): Promise<void> {
    await supabase.from("item_portions").delete().eq("id", portionId);
    setPortions((prev) => prev.filter((p: ItemPortion) => p.id !== portionId));
  }

  return (
    <div className="flex flex-col gap-6">
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo: ItemPhoto) => (
            <Image
              key={photo.id}
              src={photo.url}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
              unoptimized
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("itemDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                min={0}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="available-now"
              checked={isAvailableNow}
              onCheckedChange={setIsAvailableNow}
            />
            <Label htmlFor="available-now">{t("availableNow")}</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("portions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {portions.length > 0 && (
            <div className="space-y-2">
              {portions.map((portion: ItemPortion) => (
                <div
                  key={portion.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <span className="font-medium">{portion.label}</span>
                    <span className="ms-2 text-sm text-muted-foreground">
                      {portion.price_delta >= 0 ? "+" : ""}₪
                      {portion.price_delta}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDeletePortion(portion.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Separator />
          <div className="flex gap-2">
            <Input
              value={newPortionLabel}
              onChange={(e) => setNewPortionLabel(e.target.value)}
              placeholder={t("portionLabel")}
              className="flex-1"
            />
            <Input
              type="number"
              value={newPortionDelta}
              onChange={(e) => setNewPortionDelta(e.target.value)}
              placeholder="₪0"
              className="w-24"
              step={0.5}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddPortion}
              disabled={!newPortionLabel.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("availability")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {slots.length > 0 && (
            <ul className="space-y-2 text-sm">
              {slots.map((s: ItemAvailability) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <span>
                    D{s.day_of_week ?? "?"} · {s.start_time ?? "—"}–
                    {s.end_time ?? "—"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => void handleDeleteSlot(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Separator />
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="space-y-1">
              <Label>Day (0–6)</Label>
              <Input
                type="number"
                min={0}
                max={6}
                value={newDay}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewDay(e.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Start</Label>
              <Input
                type="time"
                value={newStart}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewStart(e.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label>End</Label>
              <Input
                type="time"
                value={newEnd}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewEnd(e.target.value)
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleAddSlot()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void handleNotifySubscribers()}
        >
          {tDash("notifySubscribers")}
        </Button>
        {notifyMsg ? (
          <p className="text-sm text-muted-foreground">{notifyMsg}</p>
        ) : null}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !name.trim() || !basePrice}
        className="w-full sm:w-auto sm:self-end"
      >
        {saving ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
