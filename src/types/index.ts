import type { Tables } from "@/lib/supabase/types";

export type Profile = Tables<"profiles">;
export type SellerApplication = Tables<"seller_applications">;
export type Shop = Tables<"shops">;
export type SellerPaymentMethod = Tables<"seller_payment_methods">;
export type Item = Tables<"items">;
export type ItemPhoto = Tables<"item_photos">;
export type ItemPortion = Tables<"item_portions">;
export type ItemAvailability = Tables<"item_availability">;
export type ItemSubscription = Tables<"item_subscriptions">;
export type Order = Tables<"orders">;
export type OrderMessage = Tables<"order_messages">;
export type Rating = Tables<"ratings">;
export type SellerMonthlyFee = Tables<"seller_monthly_fees">;
export type SellerFeePayment = Tables<"seller_fee_payments">;
export type Notification = Tables<"notifications">;

/** Manager API: approved seller row for override / impersonation UI. */
export interface ApprovedSellerRow {
  userId: string;
  email: string;
  fullName: string | null;
  shopId: string | null;
  shopName: string | null;
}

export type ItemWithPhotos = Item & {
  item_photos: ItemPhoto[];
  item_portions: ItemPortion[];
};

export type ShopWithItems = Shop & {
  items: ItemWithPhotos[];
  seller_payment_methods: SellerPaymentMethod[];
};

export type OrderWithDetails = Order & {
  items: Item;
  shops: Shop;
  item_portions: ItemPortion | null;
  order_messages: OrderMessage[];
};
