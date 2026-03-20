import { z } from "zod";

export const sellerApplicationSchema = z.object({
  business_name: z.string().min(2).max(100),
  phone: z.string().min(9).max(15),
  address: z.string().min(5).max(200),
  lat: z.number().optional(),
  lng: z.number().optional(),
  bio: z.string().max(500).optional(),
  accepted_fee_terms: z.literal(true, {
    message: "You must accept the fee terms",
  }),
});

export type SellerApplicationInput = z.infer<typeof sellerApplicationSchema>;

export const shopUpdateSchema = z.object({
  name: z.string().min(2).max(100),
  tagline: z.string().max(150).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  supports_delivery: z.boolean(),
  delivery_radius_km: z.number().min(0).optional(),
  delivery_est_minutes: z.number().min(0).optional(),
  delivery_fee: z.number().min(0).optional(),
  delivery_notes: z.string().max(500).optional(),
});

export type ShopUpdateInput = z.infer<typeof shopUpdateSchema>;

export const itemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  base_price: z.number().min(0),
  is_vegan: z.boolean(),
  allergens: z.array(z.string()),
  supply_estimate: z.string().optional(),
  stock: z.number().int().min(0).optional(),
});

export type ItemInput = z.infer<typeof itemSchema>;

export const portionSchema = z.object({
  label: z.string().min(1).max(50),
  price_delta: z.number(),
});

export type PortionInput = z.infer<typeof portionSchema>;
