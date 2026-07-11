import { ServicesManager } from "@/components/services/services-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getServices } from "@/lib/actions/services";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
};

export default async function ServicesPage() {
  await getOrCreateBusiness();
  const services = await getServices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Manage the services you offer and their pricing."
      />
      <ServicesManager services={services} />
    </div>
  );
}
