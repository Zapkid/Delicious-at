import { z } from "zod";
import { LOCALES, type Locale } from "@/lib/constants";

const localeTuple: [Locale, ...Locale[]] = LOCALES as unknown as [
  Locale,
  ...Locale[],
];

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().optional(),
  locale: z.enum(localeTuple),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
