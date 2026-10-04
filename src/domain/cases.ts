import { z } from "zod";
import { isStillStorageKey } from "./still-key.ts";

export const optionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
});

const aliasSchema = z
  .string()
  .trim()
  .min(3, "Each alias must be at least 3 characters");

const inlineStillPercent = z.number().int().min(0).max(100);

export const caseSchema = z.object({
  id: z.string().min(1),
  still: z
    .string()
    .min(1)
    .refine(isStillStorageKey, "Still must be a storage key without quotes, .., or a URL"),
  stillAlt: z.string().min(1),
  source: z.string().min(1),
  subject: z.string().min(1),
  frame: z.string().min(1),
  question: z.string().min(1),
  options: z.array(optionSchema).min(2),
  answer: z.string().min(1),
  aliases: z.array(aliasSchema).min(1),
  hint: z.string().min(1),
  title: z.string().min(1),
  ref: z.string().min(1),
  history: z.string().min(1),
  buyNew: z.url(),
  buyUsed: z.url(),
  inlineStillX: inlineStillPercent.optional(),
  inlineStillY: inlineStillPercent.optional(),
  inlineStillZoom: z.number().int().min(100).max(280).optional(),
});

/** Public API `still` is a ready-to-use path or URL, not a Storage object key. */
export const publicCaseSchema = caseSchema
  .omit({
    answer: true,
    aliases: true,
    hint: true,
    still: true,
  })
  .extend({
    still: z.string().min(1),
  });

export type WatchCase = z.infer<typeof caseSchema>;
export type PublicWatchCase = z.infer<typeof publicCaseSchema>;

export function toPublicCase(item: WatchCase): PublicWatchCase {
  const { answer: _answer, aliases: _aliases, hint: _hint, ...rest } = item;
  return publicCaseSchema.parse(rest);
}
