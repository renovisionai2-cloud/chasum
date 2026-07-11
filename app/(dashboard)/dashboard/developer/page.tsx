import { DeveloperManager } from "@/components/developer/developer-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getApiKeys, getWebhooks } from "@/lib/actions/developer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Developer" };

export default async function DeveloperPage() {
  await getOrCreateBusiness();
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
