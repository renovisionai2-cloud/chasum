import { CommandCentre } from "@/components/dashboard/command-centre";
import { DashboardSkeleton } from "@/components/ui/loading";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Command Centre",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <CommandCentre />
    </Suspense>
  );
}
