export const ADMIN_EMAILS: readonly string[] = [
  "rowan.kendal@gmail.com",
] as const;

export function isManagerEmail(email: string): boolean {
  const normalized: string = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(
    (allowed: string): boolean => allowed.toLowerCase() === normalized
  );
}

export const COMMISSION_RATE: number = 0.025;

export const ORDER_STATUS = {
  REQUESTED: "requested",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  PAID: "paid",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, { he: string; en: string }> = {
  requested: { he: "ממתין", en: "Requested" },
  accepted: { he: "אושר", en: "Accepted" },
  rejected: { he: "נדחה", en: "Rejected" },
  paid: { he: "שולם", en: "Paid" },
  delivered: { he: "נמסר", en: "Delivered" },
  cancelled: { he: "בוטל", en: "Cancelled" },
};

export const APPLICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export const PAYMENT_METHOD = {
  BIT: "bit",
  PAYBOX: "paybox",
  CASH: "cash",
  OTHER: "other",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const ACTIVE_VIEW = {
  USER: "user",
  SELLER: "seller",
} as const;

export type ActiveView = (typeof ACTIVE_VIEW)[keyof typeof ACTIVE_VIEW];

/** Set in sessionStorage before admin → seller override redirect; AuthListener clears it and sets active view to seller. */
export const FORCE_SELLER_NAV_SESSION_KEY: string = "tastey_force_seller_nav";

export const LOCALES = [
  "he",
  "en",
  "es",
  "ru",
  "ar",
  "pt",
  "pt-BR",
  "tl",
] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "he";

export const MAX_ITEM_PHOTOS: number = 5;
export const MAX_FILE_SIZE_MB: number = 5;
