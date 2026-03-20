"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { sellerApplicationSchema } from "@/lib/validators/seller";
import type { SellerApplication } from "@/types";

export default function BecomeSellerPage(): React.ReactElement {
  const t = useTranslations("seller.apply");
  const tSettings = useTranslations("settings");
  const locale: string = useLocale();
  const supabase = useSupabase();
  const { user, isSeller } = useUser();

  const [businessName, setBusinessName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [feeTermsAccepted, setFeeTermsAccepted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [existingApp, setExistingApp] = useState<SellerApplication | null>(null);
  const [checkingApp, setCheckingApp] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setCheckingApp(false);
      return;
    }

    async function checkExisting(): Promise<void> {
      const { data } = await supabase
        .from("seller_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setExistingApp(data as SellerApplication);
      setCheckingApp(false);
    }

    checkExisting();
  }, [supabase, user]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!user || !feeTermsAccepted) return;

    setSubmitting(true);
    setFormError(null);

    const parsed = sellerApplicationSchema.safeParse({
      business_name: businessName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      bio: bio.trim() || undefined,
      accepted_fee_terms: feeTermsAccepted,
    });

    if (!parsed.success) {
      setFormError(t("invalidForm"));
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("seller_applications").insert({
      user_id: user.id,
      business_name: parsed.data.business_name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      bio: parsed.data.bio ?? null,
      accepted_fee_terms: true,
    } as never);

    setSubmitting(false);

    if (error) {
      setFormError(error.message || t("submitFailed"));
      return;
    }

    setSubmitted(true);
  }

  if (checkingApp) {
    return (
      <>
        <PageHeader title={t("title")} showBack />
        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i: number) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  if (isSeller) {
    return (
      <>
        <PageHeader title={t("title")} showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
          <p className="text-lg font-semibold">{t("alreadySeller")}</p>
          <Button asChild>
            <Link href={`/${locale}/seller/dashboard`}>{t("openSellerDashboard")}</Link>
          </Button>
        </main>
      </>
    );
  }

  if (existingApp && existingApp.status === "pending") {
    return (
      <>
        <PageHeader title={t("title")} showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            {tSettings("applicationPending")}
          </Badge>
          <p className="text-sm text-muted-foreground">
            {new Date(existingApp.created_at).toLocaleDateString()}
          </p>
        </main>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <PageHeader title={t("title")} showBack />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
          <span className="text-4xl">🎉</span>
          <p className="text-lg font-semibold">{t("success")}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("title")} showBack />
      <main className="flex flex-1 flex-col gap-4 p-4">
        {existingApp?.status === "rejected" ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">
              {tSettings("applicationRejected")}
            </p>
            {existingApp.admin_note ? (
              <p className="mt-2 text-muted-foreground">{existingApp.admin_note}</p>
            ) : null}
            <p className="mt-2 text-muted-foreground">{t("reapplyHint")}</p>
          </div>
        ) : null}
        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="businessName">{t("businessName")}</Label>
            <Input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusinessName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">{t("address")}</Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">{t("bio")}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
              rows={4}
            />
          </div>
          <label className="flex items-start gap-3">
            <Checkbox
              checked={feeTermsAccepted}
              onCheckedChange={(v: boolean | "indeterminate") => setFeeTermsAccepted(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm">{t("feeTerms")}</span>
          </label>
          <Button type="submit" disabled={submitting || !feeTermsAccepted}>
            {submitting ? "..." : t("submit")}
          </Button>
        </form>
      </main>
    </>
  );
}
