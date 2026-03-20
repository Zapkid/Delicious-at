import { z } from "zod";

export const createOrderSchema = z.object({
  item_id: z.string().uuid(),
  shop_id: z.string().uuid(),
  portion_id: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
  preferred_pickup_time: z.string().optional(),
  wants_delivery: z.boolean(),
  coupon_code: z.string().min(1).max(40).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderMessageSchema = z.object({
  body: z.string().min(1).max(1000),
});

export type OrderMessageInput = z.infer<typeof orderMessageSchema>;

/** Seller experience uses DB column `stars`. */
export const orderFeedbackSchema = z.object({
  app_stars: z.number().int().min(1).max(5),
  seller_stars: z.number().int().min(1).max(5),
  item_stars: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  feedback_tags: z.array(z.string().max(40)).max(12).optional(),
});

export type OrderFeedbackInput = z.infer<typeof orderFeedbackSchema>;
