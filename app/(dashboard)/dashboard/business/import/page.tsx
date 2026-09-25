import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ImportRunControl } from "@/components/business/import-run-control";
import { ImportWorkspace } from "@/components/business/import-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { C2ImportError, getC2ImportSetup } from "@/lib/server/import-c2";
import { C3ImportError, getC3ImportWorkspace } from "@/lib/server/import-c3";

export const metadata: Metadata = {
  title: "Import data",
};

export default async function BusinessImportPage() {
  let setup: Awaited<ReturnType<typeof getC2ImportSetup>>;
  let c3: Awaited<ReturnType<typeof getC3ImportWorkspace>>;
  try {
    [setup, c3] = await Promise.all([getC2ImportSetup(), getC3ImportWorkspace()]);
  } catch (error) {
    if ((error instanceof C2ImportError && error.code === "OWNER_REQUIRED")
      || (error instanceof C3ImportError && error.code === "OWNER_REQUIRED")) {
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
      <ImportRunControl initial={c3} />
    </div>
  );
}
