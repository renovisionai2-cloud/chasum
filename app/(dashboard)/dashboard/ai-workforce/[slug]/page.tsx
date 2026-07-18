import { AlexAvailabilityPanel } from "@/components/ai-workforce/alex-availability-panel";
import { AiEmployeeDetail } from "@/components/ai-workforce/employee-detail";
import { SummerReceptionServerPanel } from "@/components/summer/summer-reception-server";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getAiEmployee } from "@/lib/ai-workforce/roster";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "emma") {
    return { title: "Summer · AI Receptionist" };
  }
  if (slug === "noah" || slug === "chase") {
    return { title: "Chase · Operations Manager" };
  }
  const employee = getAiEmployee(slug);
  if (!employee) return { title: "AI Employee" };
  return { title: `${employee.name} · AI Workforce` };
}

export default async function AiEmployeePage({ params }: PageProps) {
  await getOrCreateBusiness();
  const { slug } = await params;

  if (slug === "emma") {
    redirect("/dashboard/ai-workforce/summer");
  }
  if (slug === "noah" || slug === "chase") {
    redirect("/dashboard/workforce/chase");
  }

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

  const summerPanel =
    employee.id === "summer" ? (
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Starting Summer…</p>
        }
      >
        <SummerReceptionServerPanel />
      </Suspense>
    ) : null;

  return (
    <AiEmployeeDetail
      employee={employee}
      liveAvailability={alexPanel}
      liveReceptionist={summerPanel}
    />
  );
}
