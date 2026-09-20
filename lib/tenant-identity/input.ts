import { z } from "zod";

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const newBusinessIdentitySchema = z.object({
  name: text(2, 120),
  legalName: text(0, 120),
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  phone: text(7, 40)
    .regex(/^\+?[\d ().-]+$/)
    .refine(
      (s) =>
        s.replace(/\D/g, "").length >= 7 && s.replace(/\D/g, "").length <= 15,
    ),
  website: text(0, 255).transform((value, ctx) => {
    if (!value) return "";
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)
      )
        throw new Error();
      return url.origin.toLowerCase();
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid business website.",
      });
      return z.NEVER;
    }
  }),
  city: text(2, 100),
  region: text(2, 100),
  country: text(2, 2)
    .regex(/^[a-z]{2}$/i)
    .transform((value) => value.toUpperCase()),
  requestedSlug: text(0, 48).refine(
    (value) =>
      !value || (value.length >= 3 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)),
  ),
  confirmation: z.literal("yes"),
});

export type IdentityActionState = {
  error?: string;
  review?: boolean;
  existing?: boolean;
};
