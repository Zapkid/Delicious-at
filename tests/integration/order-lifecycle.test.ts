import { resolve } from "path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/types";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasSupabase: boolean = Boolean(url && anonKey && serviceKey);

describe.skipIf(!hasSupabase)("order lifecycle (RLS)", () => {
  const suffix: string = `${Date.now()}`;
  const sellerEmail: string = `int-seller-${suffix}@example.com`;
  const buyerEmail: string = `int-buyer-${suffix}@example.com`;
  const testPassword: string = "IntegrationTest!99";

  let sellerId: string | undefined;
  let buyerId: string | undefined;
  let shopId: string | undefined;
  let itemId: string | undefined;
  let orderId: string | undefined;

  const admin = createClient<Database>(url!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  afterAll(async (): Promise<void> => {
    if (!hasSupabase) return;
    try {
      if (orderId) {
        await admin.from("ratings").delete().eq("order_id", orderId);
        await admin.from("orders").delete().eq("id", orderId);
      }
      if (itemId) await admin.from("items").delete().eq("id", itemId);
      if (shopId) {
        await admin
          .from("seller_payment_methods")
          .delete()
          .eq("shop_id", shopId);
        await admin.from("shops").delete().eq("id", shopId);
      }
      if (sellerId) {
        await admin.from("seller_applications").delete().eq("user_id", sellerId);
        await admin.auth.admin.deleteUser(sellerId);
      }
      if (buyerId) await admin.auth.admin.deleteUser(buyerId);
    } catch {
      /* best-effort cleanup */
    }
  });

  beforeAll(async (): Promise<void> => {
    const { error: schemaErr } = await admin
      .from("ratings")
      .select("app_stars")
      .limit(1);
    const missingColumn: boolean =
      schemaErr?.code === "PGRST204" ||
      (typeof schemaErr?.message === "string" &&
        schemaErr.message.includes("app_stars"));
    if (missingColumn) {
      throw new Error(
        "Database is missing ratings.app_stars (and likely item_stars). Apply supabase/migrations/002_ratings_and_shop_profile_photo.sql in the Supabase SQL editor or via `supabase db push`, then re-run tests."
      );
    }
    if (schemaErr) throw schemaErr;

    const { data: s, error: se } = await admin.auth.admin.createUser({
      email: sellerEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (se) throw se;
    sellerId = s.user?.id;
    if (!sellerId) throw new Error("seller id missing");

    const { data: b, error: be } = await admin.auth.admin.createUser({
      email: buyerEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (be) throw be;
    buyerId = b.user?.id;
    if (!buyerId) throw new Error("buyer id missing");

    await admin
      .from("profiles")
      .update({ is_seller_approved: true })
      .eq("id", sellerId);

    const { error: appErr } = await admin.from("seller_applications").insert({
      user_id: sellerId,
      status: "approved",
      business_name: "Integration Shop",
      phone: "+10000000001",
      address: "Test City",
      accepted_fee_terms: true,
      reviewed_at: new Date().toISOString(),
      reviewed_by: sellerId,
    } as never);
    if (appErr) throw appErr;
  }, 120_000);

  it(
    "seller creates shop and item, buyer orders, seller completes delivery, buyer rates",
    async (): Promise<void> => {
      const sellerSb = createClient<Database>(url!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: signS } = await sellerSb.auth.signInWithPassword({
        email: sellerEmail,
        password: testPassword,
      });
      expect(signS).toBeNull();

      const { data: shopRow, error: shopErr } = await sellerSb
        .from("shops")
        .insert({
          seller_id: sellerId,
          name: "Integration Shop",
          is_active: true,
          supports_delivery: false,
          delivery_fee: 0,
          weekly_hours: {},
          hour_exceptions: [],
        } as never)
        .select("id")
        .single();
      expect(shopErr).toBeNull();
      shopId = (shopRow as { id: string }).id;

      const { error: pmErr } = await sellerSb.from("seller_payment_methods").insert({
        shop_id: shopId,
        method: "cash",
        is_enabled: true,
      } as never);
      expect(pmErr).toBeNull();

      const { data: itemRow, error: itemErr } = await sellerSb
        .from("items")
        .insert({
          shop_id: shopId,
          name: "Test dish",
          base_price: 10,
          is_available_now: true,
        } as never)
        .select("id")
        .single();
      expect(itemErr).toBeNull();
      itemId = (itemRow as { id: string }).id;

      const buyerSb = createClient<Database>(url!, anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await buyerSb.auth.signOut();
      const { error: signB } = await buyerSb.auth.signInWithPassword({
        email: buyerEmail,
        password: testPassword,
      });
      expect(signB).toBeNull();

      const { data: orderRow, error: orderErr } = await buyerSb
        .from("orders")
        .insert({
          consumer_id: buyerId,
          shop_id: shopId,
          item_id: itemId,
          wants_delivery: false,
          status: "requested",
        } as never)
        .select("id")
        .single();
      expect(orderErr).toBeNull();
      orderId = (orderRow as { id: string }).id;

      await sellerSb.auth.signInWithPassword({
        email: sellerEmail,
        password: testPassword,
      });

      const { error: accErr } = await sellerSb
        .from("orders")
        .update({ status: "accepted" } as never)
        .eq("id", orderId);
      expect(accErr).toBeNull();

      const { error: paidErr } = await sellerSb
        .from("orders")
        .update({ status: "paid" } as never)
        .eq("id", orderId);
      expect(paidErr).toBeNull();

      const { error: delErr } = await sellerSb
        .from("orders")
        .update({ status: "delivered" } as never)
        .eq("id", orderId);
      expect(delErr).toBeNull();

      await buyerSb.auth.signInWithPassword({
        email: buyerEmail,
        password: testPassword,
      });

      const { error: rateErr } = await buyerSb.from("ratings").insert({
        order_id: orderId,
        from_user_id: buyerId,
        to_user_id: sellerId,
        stars: 5,
        app_stars: 4,
        item_stars: 5,
        comment: "integration",
      } as never);
      expect(rateErr).toBeNull();

      const { data: rating } = await buyerSb
        .from("ratings")
        .select("app_stars, stars, item_stars")
        .eq("order_id", orderId)
        .maybeSingle();

      expect(rating).toMatchObject({
        app_stars: 4,
        stars: 5,
        item_stars: 5,
      });
    },
    120_000
  );
});
