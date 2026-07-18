import { redirect } from "next/navigation";

/** Alias — canonical Chase workspace lives at /dashboard/workforce/chase */
export default function ChaseAiWorkforceAliasPage() {
  redirect("/dashboard/workforce/chase");
}
