import { SummerReceptionWorkspace } from "@/components/summer/summer-reception-workspace";
import { getReceptionistKnowledgeSummary } from "@/lib/actions/ai-receptionist";

export async function SummerReceptionServerPanel() {
  const knowledge = await getReceptionistKnowledgeSummary();
  return (
    <SummerReceptionWorkspace
      businessName={knowledge.businessName}
      knowledgeReady={{
        serviceCount: knowledge.serviceCount,
        employeeCount: knowledge.employeeCount,
        hoursConfigured: knowledge.hoursConfigured,
      }}
    />
  );
}
