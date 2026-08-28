"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitDesignPartnerApplication,
  type DesignPartnerState,
} from "@/lib/actions/design-partner";
import { PRIVATE_ALPHA_HREF, PRIVACY_HREF } from "@/lib/marketing/alpha";
import {
  firstInvalidApplyField,
  isKnownApplyIndustry,
  readDesignPartnerSubmission,
  validateDesignPartnerSubmission,
  type ApplyFieldErrors,
  type ApplyFieldId,
} from "@/lib/marketing/apply-validation";
import { FS_BUSINESS_CATEGORIES } from "@/lib/marketing/flagship-summer";
import {
  getPricingPlan,
  type ApplyPlanIntentId,
} from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

const initial: DesignPartnerState = {};

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2";

const selectClass = cn(
  fieldClass,
  "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus:ring-destructive/40",
);

function RequiredMark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="font-normal text-muted-foreground" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="mt-1.5 break-words text-sm leading-snug text-destructive">
      {message}
    </p>
  );
}

export function DesignPartnerForm({
  initialPlan = null,
  initialIndustry = null,
  activityLabel = "Approximate monthly appointments",
  activityPlaceholder = "Approx. volume",
  painPlaceholder = "Scheduling, CRM, front desk, payments, reporting…",
  inlineValidation = false,
  showRequiredMarkers = false,
  successNote = null,
}: {
  initialPlan?: ApplyPlanIntentId | null;
  initialIndustry?: string | null;
  activityLabel?: string;
  activityPlaceholder?: string;
  painPlaceholder?: string;
  inlineValidation?: boolean;
  showRequiredMarkers?: boolean;
  successNote?: string | null;
}) {
  const [state, action, pending] = useActionState(
    submitDesignPartnerApplication,
    initial,
  );
  const [fieldErrors, setFieldErrors] = useState<ApplyFieldErrors>({});
  const pendingFocusRef = useRef<ApplyFieldId | null>(null);
  const errorSummaryId = useId();
  const emailHintId = useId();
  const industryDefault =
    initialIndustry && isKnownApplyIndustry(initialIndustry)
      ? initialIndustry
      : "";
  const [draft, setDraft] = useState({
    business_name: "",
    industry: industryDefault,
    employees: "",
    locations: "",
    current_software: "",
    monthly_activity: "",
    pain_point: "",
    email: "",
    phone: "",
    notes: "",
  });
  const interestedPlanName = initialPlan
    ? getPricingPlan(initialPlan).name
    : null;

  useEffect(() => {
    const fieldId = pendingFocusRef.current;
    if (!fieldId) return;
    pendingFocusRef.current = null;
    document.getElementById(fieldId)?.focus();
  }, [fieldErrors]);

  useEffect(() => {
    if (!state.error || state.ok) return;
    document.getElementById(errorSummaryId)?.focus();
  }, [state.error, state.ok, errorSummaryId]);

  function updateDraft(name: string, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function describedBy(fieldId: ApplyFieldId, extraId?: string) {
    const errorId = fieldErrors[fieldId] ? `${fieldId}-error` : undefined;
    const joined = [errorId, extraId].filter(Boolean).join(" ");
    return joined || undefined;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!inlineValidation) return;
    const data = readDesignPartnerSubmission(new FormData(event.currentTarget));
    const result = validateDesignPartnerSubmission(data);
    if (!result.ok) {
      event.preventDefault();
      pendingFocusRef.current = firstInvalidApplyField(result.errors);
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
  }

  if (state.ok) {
    return (
      <div
        className="rounded-2xl border border-success/30 bg-success/10 px-6 py-8 text-center"
        role="status"
      >
        <h2 className="text-xl font-semibold text-foreground">
          Application received
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you. We review every Private Alpha application personally and
          will contact you using the details provided. Meanwhile, read{" "}
          <Link
            href={PRIVATE_ALPHA_HREF}
            className="text-primary hover:underline"
          >
            why we run a Private Alpha
          </Link>
          .
        </p>
        {successNote ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {successNote}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      onReset={(event) => event.preventDefault()}
      className="space-y-5"
      noValidate={inlineValidation}
    >
      {state.error ? (
        <div
          id={errorSummaryId}
          role="alert"
          tabIndex={-1}
          className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {state.error}
        </div>
      ) : null}

      {initialPlan ? (
        <p className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Interested plan:{" "}
          <span className="font-medium text-foreground">
            {interestedPlanName}
          </span>
        </p>
      ) : null}
      {initialPlan ? (
        <input type="hidden" name="preferred_plan" value={initialPlan} />
      ) : null}

      {showRequiredMarkers ? (
        <p className="text-xs text-muted-foreground">* Required</p>
      ) : null}

      <div>
        <Label htmlFor="business_name">
          Business name
          <RequiredMark show={showRequiredMarkers} />
        </Label>
        <Input
          id="business_name"
          name="business_name"
          required
          className={fieldClass}
          autoComplete="organization"
          value={draft.business_name}
          onChange={(event) => updateDraft("business_name", event.target.value)}
          aria-invalid={fieldErrors.business_name ? true : undefined}
          aria-describedby={describedBy("business_name")}
        />
        <FieldError id="business_name" message={fieldErrors.business_name} />
      </div>

      <div>
        <Label htmlFor="industry">
          Business type
          <RequiredMark show={showRequiredMarkers} />
        </Label>
        <select
          id="industry"
          name="industry"
          required
          className={selectClass}
          value={draft.industry}
          onChange={(event) => updateDraft("industry", event.target.value)}
          aria-invalid={fieldErrors.industry ? true : undefined}
          aria-describedby={describedBy("industry")}
        >
          <option value="" disabled={!inlineValidation}>
            Select a business type
          </option>
          {FS_BUSINESS_CATEGORIES.map((category) => (
            <optgroup key={category.id} label={category.label}>
              {category.industries.map((industry) => (
                <option key={industry.id} value={industry.label}>
                  {industry.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <FieldError id="industry" message={fieldErrors.industry} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="employees">
            Team size
            <RequiredMark show={showRequiredMarkers} />
          </Label>
          <Input
            id="employees"
            name="employees"
            required
            placeholder="e.g. 1–5, 6–20"
            className={fieldClass}
            value={draft.employees}
            onChange={(event) => updateDraft("employees", event.target.value)}
            aria-invalid={fieldErrors.employees ? true : undefined}
            aria-describedby={describedBy("employees")}
          />
          <FieldError id="employees" message={fieldErrors.employees} />
        </div>
        <div className="min-w-0">
          <Label htmlFor="locations">
            Number of locations
            <RequiredMark show={showRequiredMarkers} />
          </Label>
          <Input
            id="locations"
            name="locations"
            required
            placeholder="e.g. 1, 2–5"
            className={fieldClass}
            inputMode="numeric"
            value={draft.locations}
            onChange={(event) => updateDraft("locations", event.target.value)}
            aria-invalid={fieldErrors.locations ? true : undefined}
            aria-describedby={describedBy("locations")}
          />
          <FieldError id="locations" message={fieldErrors.locations} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="current_software">
            Current scheduling or business software
            <RequiredMark show={showRequiredMarkers} />
          </Label>
          <Input
            id="current_software"
            name="current_software"
            required
            placeholder="Picktime, Fresha, Square…"
            className={fieldClass}
            value={draft.current_software}
            onChange={(event) =>
              updateDraft("current_software", event.target.value)
            }
            aria-invalid={fieldErrors.current_software ? true : undefined}
            aria-describedby={describedBy("current_software")}
          />
          <FieldError
            id="current_software"
            message={fieldErrors.current_software}
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="monthly_activity">
            {activityLabel}
            <RequiredMark show={showRequiredMarkers} />
          </Label>
          <Input
            id="monthly_activity"
            name="monthly_activity"
            required
            placeholder={activityPlaceholder}
            className={fieldClass}
            value={draft.monthly_activity}
            onChange={(event) =>
              updateDraft("monthly_activity", event.target.value)
            }
            aria-invalid={fieldErrors.monthly_activity ? true : undefined}
            aria-describedby={describedBy("monthly_activity")}
          />
          <FieldError
            id="monthly_activity"
            message={fieldErrors.monthly_activity}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="pain_point">
          What would you most like to improve?
          <RequiredMark show={showRequiredMarkers} />
        </Label>
        <Textarea
          id="pain_point"
          name="pain_point"
          required
          rows={3}
          className={fieldClass}
          placeholder={painPlaceholder}
          value={draft.pain_point}
          onChange={(event) => updateDraft("pain_point", event.target.value)}
          aria-invalid={fieldErrors.pain_point ? true : undefined}
          aria-describedby={describedBy("pain_point")}
        />
        <FieldError id="pain_point" message={fieldErrors.pain_point} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="email">
            Work email
            <RequiredMark show={showRequiredMarkers} />
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className={fieldClass}
            autoComplete="email"
            value={draft.email}
            onChange={(event) => updateDraft("email", event.target.value)}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={describedBy("email", emailHintId)}
          />
          <FieldError id="email" message={fieldErrors.email} />
          <p id={emailHintId} className="mt-1.5 text-xs text-muted-foreground">
            Used only to follow up on your application. See our{" "}
            <Link href={PRIVACY_HREF} className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="min-w-0">
          <Label htmlFor="phone">
            Phone number{" "}
            <span className="font-normal text-muted-foreground">
              · optional
            </span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            className={fieldClass}
            autoComplete="tel"
            placeholder="Any format is fine"
            value={draft.phone}
            onChange={(event) => updateDraft("phone", event.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">
          Anything else we should know?{" "}
          <span className="font-normal text-muted-foreground">· optional</span>
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          className={fieldClass}
          value={draft.notes}
          onChange={(event) => updateDraft("notes", event.target.value)}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-full"
        disabled={pending}
      >
        {pending ? "Submitting…" : "Submit my application"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By applying you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
