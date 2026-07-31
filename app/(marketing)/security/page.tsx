import { SecurityExperience } from "@/components/landing/security-experience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Security built into Chasum—secure authentication, protected business workspaces, encrypted connections, and honest Private Alpha transparency.",
};

export default function SecurityPage() {
  return <SecurityExperience />;
}
