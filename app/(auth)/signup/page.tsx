import {
  AuthField,
  AuthForm,
  AuthLink,
} from "@/components/auth/auth-form";
import { signUp } from "@/lib/actions/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignUpPage() {
  return (
    <AuthForm
      title="Create your account"
      description="Start scheduling smarter in minutes"
      action={signUp}
      submitLabel="Create account"
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
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
        placeholder="you@example.com"
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
