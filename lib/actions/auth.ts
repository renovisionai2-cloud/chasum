"use server";

import {
  getAuthCallbackUrl,
  getPasswordResetRedirectUrl,
  getSupabaseEnv,
} from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = {
  error?: string;
  success?: string;
};

function supabaseNotConfiguredState(): AuthState {
  return {
    error:
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
  };
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!getSupabaseEnv()) {
    return supabaseNotConfiguredState();
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        preferred_plan: formData.get("plan") as string | null,
      },
      emailRedirectTo: getAuthCallbackUrl("/dashboard"),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user && !data.session) {
    return {
      success: "Check your email to confirm your account before signing in.",
    };
  }

  redirect("/dashboard");
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!getSupabaseEnv()) {
    return supabaseNotConfiguredState();
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const redirectTo = formData.get("redirect") as string;
  redirect(redirectTo || "/dashboard");
}

export async function resetPassword(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required." };
  }

  if (!getSupabaseEnv()) {
    return supabaseNotConfiguredState();
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectUrl(),
  });

  if (error) {
    if (/invalid path/i.test(error.message)) {
      return {
        error:
          "Password reset could not start because the app redirect URL is invalid. Set NEXT_PUBLIC_APP_URL to your live HTTPS site (for example https://chasum.vercel.app), add that URL’s /auth/callback to Supabase Auth redirect allow-list, then redeploy.",
      };
    }
    return { error: error.message };
  }

  return {
    success: "Check your email for a password reset link.",
  };
}

export async function updatePassword(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Both password fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!getSupabaseEnv()) {
    return supabaseNotConfiguredState();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Your reset link has expired. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  if (getSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
