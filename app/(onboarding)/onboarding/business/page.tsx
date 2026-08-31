import { CreateBusinessForm } from "@/components/onboarding/create-business-form";
import { getBusiness, requireUser } from "@/lib/actions/business";
import { isPlatformOwner } from "@/lib/owner/auth";
import { DASHBOARD_PATH } from "@/lib/tenancy/post-auth-destination";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Set up your business",
};

export default async function BusinessOnboardingPage() {
  const user = await requireUser();
  const business = await getBusiness();
  if (business) {
    redirect(DASHBOARD_PATH);
  }

  const showPlatformAdmin = await isPlatformOwner(user);

  return <CreateBusinessForm showPlatformAdmin={showPlatformAdmin} />;
}
