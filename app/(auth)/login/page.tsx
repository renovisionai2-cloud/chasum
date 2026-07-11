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
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect: redirectTo, error } = await searchParams;
  const supabaseNotConfigured = error === "supabase_not_configured";

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to your Chasum account"
      action={signIn}
      submitLabel="Sign in"
      hiddenFields={redirectTo ? { redirect: redirectTo } : undefined}
      alert={
        supabaseNotConfigured ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Supabase is not configured. Add your credentials to{" "}
            <code className="text-xs">.env.local</code> to enable
            authentication.
          </div>
        ) : undefined
      }
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
