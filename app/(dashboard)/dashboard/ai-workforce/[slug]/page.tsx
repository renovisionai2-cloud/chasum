import { AlexAvailabilityPanel } from "@/components/ai-workforce/alex-availability-panel";
import { AiEmployeeDetail } from "@/components/ai-workforce/employee-detail";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getAiEmployee } from "@/lib/ai-workforce/roster";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const employee = getAiEmployee(slug);
  if (!employee) return { title: "AI Employee" };
  return { title: `${employee.name} · AI Workforce` };
}

export default async function AiEmployeePage({ params }: PageProps) {
  await getOrCreateBusiness();
  const { slug } = await params;
  const employee = getAiEmployee(slug);
  if (!employee) notFound();

  const alexPanel =
    employee.id === "alex" ? (
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">
            Checking real availability…
          </p>
        }
      >
        <AlexAvailabilityPanel />
      </Suspense>
    ) : null;

  return (
    <AiEmployeeDetail employee={employee} liveAvailability={alexPanel} />
  );
}
