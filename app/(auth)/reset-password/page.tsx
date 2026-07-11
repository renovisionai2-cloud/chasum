import {
  AuthField,
  AuthForm,
  AuthLink,
} from "@/components/auth/auth-form";
import { updatePassword } from "@/lib/actions/auth";
import { getSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reset password",
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  if (!getSupabaseEnv()) {
    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=session_expired");
  }

  return (
    <AuthForm
      title="Set a new password"
      description="Choose a strong password for your account"
      action={updatePassword}
      submitLabel="Update password"
      footer={
        <>
          Remember your password? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <AuthField
        id="password"
        label="New password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
      />
      <AuthField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
      />
    </AuthForm>
  );
}
