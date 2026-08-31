import { BUSINESS_ONBOARDING_PATH } from "@/lib/tenancy/post-auth-destination";
import { redirect } from "next/navigation";

export default function OnboardingIndexPage() {
  redirect(BUSINESS_ONBOARDING_PATH);
}
