import { z } from "zod";
import { publicCaseSchema } from "../domain/cases";

export { publicCaseSchema };

export const errorSchema = z.object({
  error: z.string().min(1),
});

export const identBodySchema = z.object({
  guess: z.string().trim().min(1),
});

export const dossierSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  ref: z.string().min(1),
  history: z.string().min(1),
  buyNew: z.url(),
  buyUsed: z.url(),
});

export const identSuccessSchema = z.object({
  correct: z.literal(true),
  alreadyIdentified: z.boolean(),
  dossier: dossierSchema,
});

export const identMissSchema = z.object({
  correct: z.literal(false),
  hint: z.string().min(1),
});

export const identResponseSchema = z.discriminatedUnion("correct", [
  identSuccessSchema,
  identMissSchema,
]);

export const sessionResponseSchema = z.object({
  identified: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  locked: z.array(z.string()),
  index: z.number().int().nonnegative(),
});

export const publicCaseListSchema = z.array(publicCaseSchema);

export type Dossier = z.infer<typeof dossierSchema>;
export type IdentResponse = z.infer<typeof identResponseSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
