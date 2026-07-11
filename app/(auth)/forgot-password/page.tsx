import {
  AuthField,
  AuthForm,
  AuthLink,
} from "@/components/auth/auth-form";
import { resetPassword } from "@/lib/actions/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const sessionExpired = error === "session_expired";

  return (
    <AuthForm
      title="Reset your password"
      description="Enter your email and we'll send you a reset link"
      action={resetPassword}
      submitLabel="Send reset link"
      alert={
        sessionExpired ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Your reset link has expired. Please request a new one.
          </div>
        ) : undefined
      }
      footer={
        <>
          Remember your password? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <AuthField
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
      />
    </AuthForm>
  );
}
