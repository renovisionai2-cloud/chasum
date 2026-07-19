import { PrivateAlphaWorkspace } from "@/components/hq/private-alpha-workspace";
import { getPrivateAlphaSnapshot } from "@/lib/hq/private-alpha/snapshot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Alpha · Chasum HQ",
  description:
    "Private Alpha management platform for Founding Design Partners — internal only.",
};

export default async function PrivateAlphaPage() {
  const snapshot = await getPrivateAlphaSnapshot();
  return <PrivateAlphaWorkspace snapshot={snapshot} />;
}
