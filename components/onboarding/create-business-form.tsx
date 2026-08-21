"use client";

import { signOut } from "@/lib/actions/auth";
import { createInitialBusinessAction } from "@/lib/actions/create-initial-business";
import { BUSINESS_CURRENCIES } from "@/lib/commerce/money";
import { BUSINESS_NAME_MAX_LENGTH } from "@/lib/onboarding/business-name";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import type { ActionState } from "@/lib/types/booking";
import { PLATFORM_ADMIN_PATH } from "@/lib/tenancy/post-auth-destination";
import Link from "next/link";
import { useActionState } from "react";

const initialState: ActionState = {};

export function CreateBusinessForm({
  showPlatformAdmin = false,
}: {
  showPlatformAdmin?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createInitialBusinessAction,
    initialState,
  );

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Business setup
        </p>
        <CardTitle className="text-2xl sm:text-[1.65rem]">
          Tell us about your business
        </CardTitle>
        <CardDescription className="text-pretty text-base leading-relaxed">
          Enter the name, timezone, and currency customers and your team should
          see. This creates your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="ds-form-stack space-y-6">
          <Field
            label="Business name"
            htmlFor="businessName"
            required
            hint="Use the real business name. It can be changed later in Business settings."
          >
            <Input
              name="businessName"
              autoComplete="organization"
              autoFocus
              maxLength={BUSINESS_NAME_MAX_LENGTH}
              placeholder="Northshore Clinic"
              required
            />
          </Field>

          <Field
            label="Timezone"
            htmlFor="timezone"
            required
            hint="Appointment times and calendars use this timezone."
          >
            <TimezoneSelect
              id="timezone"
              name="timezone"
              label=""
              required
              defaultValue=""
              placeholder="Select timezone"
            />
          </Field>

          <Field
            label="Currency"
            htmlFor="currency"
            required
            hint="Prices, invoices, and reports use this currency."
          >
            <Select id="currency" name="currency" required defaultValue="">
              <option value="" disabled>
                Select currency
              </option>
              {BUSINESS_CURRENCIES.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </Select>
          </Field>

          {state.error ? (
            <div
              className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {state.error}
            </div>
          ) : null}

          {state.success ? (
            <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              {state.success}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Creating your business…" : "Continue"}
          </Button>
        </form>

        {showPlatformAdmin ? (
          <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
            Platform Admin access does not require a business tenant.{" "}
            <Link
              href={PLATFORM_ADMIN_PATH}
              className="font-medium text-primary hover:text-primary/80"
            >
              Open Platform Admin
            </Link>
          </p>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <button
            type="button"
            className="font-medium text-primary hover:text-primary/80"
            onClick={() => {
              void signOut();
            }}
          >
            Sign out
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
