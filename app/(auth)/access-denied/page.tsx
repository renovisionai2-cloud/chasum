import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { getSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Access unavailable",
};

export const dynamic = "force-dynamic";

export default async function AccessDeniedPage() {
  if (!getSupabaseEnv()) {
    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Access unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your access to this business is unavailable or has been revoked. Contact
        the business owner.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Signed in as {user.email ?? "this account"}.
      </p>
      <form action={signOut} className="mt-8">
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  );
}
