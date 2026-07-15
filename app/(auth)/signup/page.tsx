import {
  resolveInitialPlan,
  SignUpForm,
} from "@/components/auth/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
};

type SignUpPageProps = {
  searchParams: Promise<{ plan?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  return <SignUpForm initialPlan={resolveInitialPlan(params.plan)} />;
}
