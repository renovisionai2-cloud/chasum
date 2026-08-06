import { DeveloperManager } from "@/components/developer/developer-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getApiKeys, getWebhooks } from "@/lib/actions/developer";
import { planAllowsApiIntegrations } from "@/lib/billing/plan-features";
import { isPlatformOwner } from "@/lib/owner/auth";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Developer" };

export default async function DeveloperPage() {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const owner = user ? await isPlatformOwner(user) : false;

  if (!owner && !planAllowsApiIntegrations(business)) {
    redirect("/dashboard");
  }

  const [apiKeys, webhooks] = await Promise.all([getApiKeys(), getWebhooks()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer"
        description="API keys, webhooks, and integration endpoints for Zapier and Make.com."
      />
      <DeveloperManager apiKeys={apiKeys} webhooks={webhooks} />
    </div>
  );
}
