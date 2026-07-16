import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffProfileRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/employees/${id}`);
}
