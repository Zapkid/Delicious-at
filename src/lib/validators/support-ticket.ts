import { z } from "zod";

export const supportTicketSchema = z.object({
  body: z.string().min(1).max(2000),
  issue_photo_url: z.string().max(500).nullable().optional(),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
