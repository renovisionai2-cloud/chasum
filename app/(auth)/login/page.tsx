import {
  AuthField,
  AuthForm,
  AuthLink,
} from "@/components/auth/auth-form";
import { signIn } from "@/lib/actions/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
};

type PageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect: redirectTo } = await searchParams;

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to your Chasum account"
      action={signIn}
      submitLabel="Sign in"
      hiddenFields={redirectTo ? { redirect: redirectTo } : undefined}
      footer={
        <>
          <AuthLink href="/forgot-password">Forgot your password?</AuthLink>
          <span className="mx-2">·</span>
          Don&apos;t have an account? <AuthLink href="/signup">Sign up</AuthLink>
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
      <AuthField
        id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
      />
    </AuthForm>
  );
}
