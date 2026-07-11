import { CustomersManager } from "@/components/customers/customers-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getCustomers } from "@/lib/actions/customers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients",
};

export default async function ClientsPage() {
  await getOrCreateBusiness();
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Your customer database — everyone who has booked with you."
      />
      <CustomersManager customers={customers} />
    </div>
  );
}
