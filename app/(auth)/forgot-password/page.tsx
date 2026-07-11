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

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      title="Reset your password"
      description="Enter your email and we'll send you a reset link"
      action={resetPassword}
      submitLabel="Send reset link"
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
