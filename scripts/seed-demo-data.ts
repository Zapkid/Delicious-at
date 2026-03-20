/**
 * Demo data for local / E2E. Requires migrated DB (002_ratings_and_shop_profile_photo.sql).
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, optional SEED_USER_PASSWORD (default SeedPassword123!)
 * Loads .env.local from the repo root (tsx does not load it automatically).
 */
import { resolve } from "path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });
import type { Database } from "../src/lib/supabase/types";
import { ADMIN_EMAILS } from "../src/lib/constants";
import { DEMO_SELLERS } from "../src/lib/demo-sellers";

const url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password: string = process.env.SEED_USER_PASSWORD ?? "SeedPassword123!";

const adminEmail: string = ADMIN_EMAILS[0] ?? "admin@seed.local";

const CONSUMER_EMAIL: string = "buyer@seed.local";

/** For admin UI E2E: not approved until an admin approves. */
const PENDING_SELLER_EMAIL: string = "pending@seed.local";
const PENDING_BUSINESS: string = "Pending Demo Kitchen";

async function ensureAuthUser(
  sb: ReturnType<typeof createClient<Database>>,
  email: string,
  fullName: string
): Promise<string> {
  const perPage: number = 200;
  let page: number = 1;
  let foundId: string | null = null;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data.users;
    const hit = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (hit) {
      foundId = hit.id;
      break;
    }
    if (users.length < perPage) break;
    page += 1;
  }

  if (foundId) {
    await sb.auth.admin.updateUserById(foundId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    return foundId;
  }

  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr) throw createErr;
  const id: string | undefined = created.user?.id;
  if (!id) throw new Error(`No user id for ${email}`);
  return id;
}

async function main(): Promise<void> {
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local in the project root, then run: npm run seed:demo"
    );
    process.exit(1);
  }

  const sb = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const adminId: string = await ensureAuthUser(sb, adminEmail, "Seed Admin");
  const consumerId: string = await ensureAuthUser(sb, CONSUMER_EMAIL, "Seed Buyer");
  const pendingUserId: string = await ensureAuthUser(
    sb,
    PENDING_SELLER_EMAIL,
    "Pending Applicant"
  );

  const sellerIds: string[] = [];
  for (const s of DEMO_SELLERS) {
    sellerIds.push(await ensureAuthUser(sb, s.email, s.shop));
  }

  await sb
    .from("profiles")
    .update({ is_seller_approved: true, active_view: "seller" })
    .in("id", sellerIds);

  await sb
    .from("profiles")
    .update({ is_seller_approved: false })
    .eq("id", pendingUserId);

  const { data: pendApp } = await sb
    .from("seller_applications")
    .select("id")
    .eq("user_id", pendingUserId)
    .maybeSingle();

  if (!pendApp) {
    const { error: pErr } = await sb.from("seller_applications").insert({
      user_id: pendingUserId,
      status: "pending",
      business_name: PENDING_BUSINESS,
      phone: "+972509999999",
      address: "Tel Aviv",
      bio: "Awaiting approval",
      accepted_fee_terms: true,
    } as never);
    if (pErr) throw pErr;
  } else {
    await sb
      .from("seller_applications")
      .update({
        status: "pending",
        business_name: PENDING_BUSINESS,
        reviewed_at: null,
        reviewed_by: null,
      } as never)
      .eq("user_id", pendingUserId);
  }

  for (let i: number = 0; i < DEMO_SELLERS.length; i += 1) {
    const seller = DEMO_SELLERS[i];
    const userId: string = sellerIds[i];

    const { data: existingApp } = await sb
      .from("seller_applications")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingApp) {
      const { error: appErr } = await sb.from("seller_applications").insert({
        user_id: userId,
        status: "approved",
        business_name: seller.shop,
        phone: "+972501234567",
        address: "Tel Aviv",
        bio: "Demo seller",
        accepted_fee_terms: true,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      } as never);
      if (appErr) throw appErr;
    } else {
      await sb
        .from("seller_applications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        } as never)
        .eq("id", (existingApp as { id: string }).id);
    }

    const { data: existingShop } = await sb
      .from("shops")
      .select("id")
      .eq("seller_id", userId)
      .maybeSingle();

    let shopId: string;
    if (existingShop) {
      shopId = (existingShop as { id: string }).id;
      await sb
        .from("shops")
        .update({
          name: seller.shop,
          is_active: true,
          address: "Tel Aviv",
        } as never)
        .eq("id", shopId);
    } else {
      const { data: shop, error: shopErr } = await sb
        .from("shops")
        .insert({
          seller_id: userId,
          name: seller.shop,
          tagline: "Homemade with love",
          description: "Demo shop for testing",
          is_active: true,
          supports_delivery: false,
          delivery_fee: 0,
          weekly_hours: {},
          hour_exceptions: [],
          address: "Tel Aviv",
        } as never)
        .select("id")
        .single();
      if (shopErr) throw shopErr;
      shopId = (shop as { id: string }).id;
    }

    const { data: cash } = await sb
      .from("seller_payment_methods")
      .select("id")
      .eq("shop_id", shopId)
      .eq("method", "cash")
      .maybeSingle();

    if (!cash) {
      await sb.from("seller_payment_methods").insert({
        shop_id: shopId,
        method: "cash",
        is_enabled: true,
      } as never);
    }

    for (let j: number = 0; j < seller.items.length; j += 1) {
      const itemName: string = seller.items[j];
      const { data: existingItem } = await sb
        .from("items")
        .select("id")
        .eq("shop_id", shopId)
        .eq("name", itemName)
        .maybeSingle();

      if (!existingItem) {
        const { error: itemErr } = await sb.from("items").insert({
          shop_id: shopId,
          name: itemName,
          description: "Demo item",
          base_price: 25 + j * 5,
          is_vegan: j === 0 && i === 0,
          is_available_now: true,
          sort_order: j,
        } as never);
        if (itemErr) throw itemErr;
      } else {
        await sb
          .from("items")
          .update({ is_available_now: true } as never)
          .eq("id", (existingItem as { id: string }).id);
      }
    }
  }

  console.log("Seed complete.");
  console.log("Password for all:", password);
  console.log("Admin:", adminEmail);
  console.log("Consumer:", CONSUMER_EMAIL);
  DEMO_SELLERS.forEach((s) => console.log("Seller:", s.email, "→", s.shop));
  console.log("Pending applicant:", PENDING_SELLER_EMAIL, "→", PENDING_BUSINESS);
  console.log("Consumer id:", consumerId);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
