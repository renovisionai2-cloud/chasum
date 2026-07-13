import { AiEmployeeDetail } from "@/components/ai-workforce/employee-detail";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { getAiEmployee } from "@/lib/ai-workforce/roster";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  return <AiEmployeeDetail employee={employee} />;
}
