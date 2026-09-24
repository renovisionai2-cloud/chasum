import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ImportWorkspace } from "@/components/business/import-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { C2ImportError, getC2ImportSetup } from "@/lib/server/import-c2";

export const metadata: Metadata = {
  title: "Import data",
};

export default async function BusinessImportPage() {
  let setup: Awaited<ReturnType<typeof getC2ImportSetup>>;
  try {
    setup = await getC2ImportSetup();
  } catch (error) {
    if (error instanceof C2ImportError && error.code === "OWNER_REQUIRED") {
      redirect("/access-denied");
    }
    throw error;
  }

  return (
    <div className="ds-page">
      <PageHeader
        title="Import data"
        description="Review CSV data safely before anything can enter your Chasum operating system."
      />
      <ImportWorkspace initial={setup} />
    </div>
  );
}
