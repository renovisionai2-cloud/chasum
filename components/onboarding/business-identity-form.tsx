"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { submitBusinessIdentity } from "@/lib/actions/tenant-identity";
import type { IdentityActionState } from "@/lib/tenant-identity/input";
import { Button } from "@/components/ui/button";

export function BusinessIdentityForm() {
  const [intent, setIntent] = useState<"join_existing" | "create_new" | "">("");
  const [state, action, pending] = useActionState<
    IdentityActionState,
    FormData
  >(submitBusinessIdentity, {});
  if (state.review || state.existing)
    return (
      <section className="mt-8 space-y-4" aria-live="polite">
        <h2 className="text-xl font-semibold">
          {state.review
            ? "Let’s confirm your business identity"
            : "Get access to your existing business"}
        </h2>
        <p>
          {state.review
            ? "These details need a Private Alpha review before a new business can be created."
            : "Ask your existing business owner to invite you to Chasum. For recovery or a change of owner, contact Chasum Support."}
        </p>
        <p>
          No new business or membership was created. A new location or a
          different owner email should use the existing business.
        </p>
        <Link className="inline-block underline" href="/contact">
          Contact Chasum Support
        </Link>
        <Link className="block underline" href="/dashboard" prefetch={false}>
          Check my business access
        </Link>
      </section>
    );
  return (
    <form action={action} className="mt-8 space-y-6">
      <fieldset className="space-y-3" disabled={pending}>
        <legend className="mb-3 font-medium">
          How would you like to continue?
        </legend>
        {(
          [
            [
              "join_existing",
              "My business is already on Chasum / I need access",
            ],
            ["create_new", "Create a new business"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"
          >
            <input
              className="mt-1"
              type="radio"
              name="intent"
              value={value}
              checked={intent === value}
              onChange={() => setIntent(value)}
              required
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      {intent === "join_existing" && (
        <p className="text-sm text-muted-foreground">
          Use an owner invitation or request a Private Alpha review. This will
          not create a business or grant access automatically.
        </p>
      )}
      {intent === "create_new" && (
        <fieldset disabled={pending} className="space-y-4">
          <legend className="font-medium">Business identity</legend>
          <p className="text-sm text-muted-foreground">
            Use the business’s current contact details, including for
            franchises. These help us avoid creating a second business account.
          </p>
          {(
            [
              ["name", "Business name", "text", true, 120],
              ["legalName", "Legal name (optional)", "text", false, 120],
              ["email", "Business email", "email", true, 254],
              [
                "phone",
                "Business phone (include country code)",
                "tel",
                true,
                40,
              ],
              ["website", "Business website (optional)", "text", false, 255],
              ["city", "City", "text", true, 100],
              ["region", "State / province / region", "text", true, 100],
              [
                "country",
                "Country code (for example CA or US)",
                "text",
                true,
                2,
              ],
              [
                "requestedSlug",
                "Preferred booking link (optional)",
                "text",
                false,
                48,
              ],
            ] as const
          ).map(([name, label, type, required, maxLength]) => (
            <div key={name}>
              <label htmlFor={name} className="mb-1 block text-sm font-medium">
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                required={required}
                minLength={name === "requestedSlug" ? 3 : undefined}
                maxLength={maxLength}
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </div>
          ))}
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="confirmation"
              value="yes"
              required
              className="mt-1"
            />
            <span>
              This is a genuinely new business, not another location, a
              replacement account, or a change of owner for a business already
              on Chasum.
            </span>
          </label>
          <p className="text-sm text-muted-foreground">
            Your business starts on Free. A paid-plan preference does not
            activate billing.
          </p>
        </fieldset>
      )}
      {state.error && (
        <div role="alert" className="text-sm text-destructive">
          <p>{state.error}</p>
          <Link href="/contact" className="mt-2 inline-block underline">
            Contact Chasum Support
          </Link>
        </div>
      )}
      <Button
        type="submit"
        disabled={!intent || pending}
        className="w-full sm:w-auto"
      >
        {pending
          ? "Checking business identity…"
          : intent === "create_new"
            ? "Confirm and create business"
            : "Continue with existing business"}
      </Button>
      <Link
        className="block text-sm underline"
        href="/dashboard"
        prefetch={false}
      >
        Already invited? Check my business access
      </Link>
    </form>
  );
}
