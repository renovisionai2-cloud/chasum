"use client";

import { signOut } from "@/lib/actions/auth";
import { createInitialBusinessAction } from "@/lib/actions/create-initial-business";
import { BUSINESS_CURRENCIES } from "@/lib/commerce/money";
import {
  DEFAULT_ONBOARDING_CURRENCY,
  DEFAULT_ONBOARDING_TIMEZONE,
} from "@/lib/onboarding/business-locale";
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
          Name your business
        </CardTitle>
        <CardDescription className="text-pretty text-base leading-relaxed">
          Chasum is organized around a business. Enter the name customers and
          your team should see — this creates your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="ds-form-stack space-y-6">
          <Field
            label="Business name"
            htmlFor="businessName"
            required
            hint="Use the real business name. It can be changed later in Business settings."
            error={state.error}
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

          <TimezoneSelect
            id="timezone"
            name="timezone"
            label="Timezone"
            defaultValue={DEFAULT_ONBOARDING_TIMEZONE}
            required
          />

          <Field label="Currency" htmlFor="currency" required>
            <Select
              name="currency"
              defaultValue={DEFAULT_ONBOARDING_CURRENCY}
              required
            >
              {BUSINESS_CURRENCIES.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </Select>
          </Field>

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
            {pending ? "Creating your business…" : "Create business"}
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
