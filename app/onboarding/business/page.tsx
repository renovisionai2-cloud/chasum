export const dynamic = "force-dynamic";

import { getSupabaseEnv } from "@/lib/env";
import { requireUser, resolveBusinessForUser } from "@/lib/actions/business";
import { hasOperatorMarker } from "@/lib/access/operator-membership";
import { BusinessIdentityForm } from "@/components/onboarding/business-identity-form";
import { redirect } from "next/navigation";

export default async function BusinessOnboardingPage() {
  if (!getSupabaseEnv()) redirect("/login?error=supabase_not_configured");
  const user = await requireUser();
  if (await resolveBusinessForUser(user.id)) redirect("/dashboard");
  if (hasOperatorMarker(user.app_metadata)) redirect("/access-denied");
  if (!user.email_confirmed_at)
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Verify your account email</h1>
        <p className="mt-4">
          Use the verification link in your email before setting up a business.
        </p>
      </main>
    );
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-12 sm:px-8">
      <p className="text-sm font-semibold text-primary">
        Chasum · Business setup
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Connect to your business</h1>
      <p className="mt-3 text-muted-foreground">
        Your account is ready. Choose whether you need access to an existing
        business or are setting up a genuinely new one.
      </p>
      <BusinessIdentityForm />
    </main>
  );
}
