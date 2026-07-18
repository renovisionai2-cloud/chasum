import { ChaseOpsWorkspace } from "@/components/chase/chase-ops-workspace";
import { loadChaseOperationsSnapshot } from "@/lib/actions/chase";

export async function ChaseOpsServerPanel() {
  const snapshot = await loadChaseOperationsSnapshot();
  return <ChaseOpsWorkspace snapshot={snapshot} />;
}
