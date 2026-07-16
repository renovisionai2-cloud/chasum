"use client";

import {
  AuthField,
  AuthForm,
  AuthLink,
} from "@/components/auth/auth-form";
import { OnboardingPlanSelect } from "@/components/marketing/onboarding-plan-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { signUp } from "@/lib/actions/auth";
import {
  getMarketingPlan,
  type MarketingPlanId,
} from "@/lib/marketing/pricing";
import { useState } from "react";

export function SignUpForm({
  initialPlan = "free",
}: {
  initialPlan?: MarketingPlanId;
}) {
  const [plan, setPlan] = useState<MarketingPlanId>(initialPlan);
  const selected = getMarketingPlan(plan);

  if (selected.id === "enterprise") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="mb-8">
          <Logo />
        </div>
        <Card className="w-full max-w-md border-border/60 shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Start scheduling smarter in minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <OnboardingPlanSelect value={plan} onChange={setPlan} />
            <p className="text-sm text-muted-foreground">
              {selected.description}
            </p>
            <a href={selected.href} className="block">
              <Button type="button" className="w-full">
                {selected.cta}
              </Button>
            </a>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <AuthLink href="/login">Sign in</AuthLink>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthForm
      title="Create your account"
      description="Start scheduling smarter in minutes"
      action={signUp}
      submitLabel={selected.cta}
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <OnboardingPlanSelect value={plan} onChange={setPlan} />
      <AuthField
        id="fullName"
        label="Full name"
        placeholder="Jane Smith"
        autoComplete="name"
      />
      <AuthField
        id="email"
        label="Email"
        type="email"
        placeholder="you@email.com"
        autoComplete="email"
      />
      <AuthField
        id="password"
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
      />
    </AuthForm>
  );
}
