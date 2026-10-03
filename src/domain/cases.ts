import { z } from "zod";

export const optionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
});

export const caseSchema = z.object({
  id: z.string().min(1),
  still: z.string().min(1),
  stillAlt: z.string().min(1),
  source: z.string().min(1),
  subject: z.string().min(1),
  frame: z.string().min(1),
  question: z.string().min(1),
  options: z.array(optionSchema).min(2),
  answer: z.string().min(1),
  aliases: z.array(z.string().min(1)).min(1),
  hint: z.string().min(1),
  title: z.string().min(1),
  ref: z.string().min(1),
  history: z.string().min(1),
  buyNew: z.url(),
  buyUsed: z.url(),
});

export const publicCaseSchema = caseSchema.omit({
  answer: true,
  aliases: true,
  hint: true,
});

export type WatchCase = z.infer<typeof caseSchema>;
export type PublicWatchCase = z.infer<typeof publicCaseSchema>;

export function toPublicCase(item: WatchCase): PublicWatchCase {
  return publicCaseSchema.parse(item);
}
