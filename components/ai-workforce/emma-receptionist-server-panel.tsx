import { EmmaReceptionistPanel } from "@/components/ai-workforce/emma-receptionist-panel";
import {
  getReceptionistKnowledgeSummary,
  listReceptionistConversations,
} from "@/lib/actions/ai-receptionist";

/** Server wrapper: loads grounded knowledge + conversation list for Emma. */
export async function EmmaReceptionistServerPanel() {
  const [knowledge, conversations] = await Promise.all([
    getReceptionistKnowledgeSummary(),
    listReceptionistConversations(),
  ]);

  return (
    <EmmaReceptionistPanel
      knowledge={knowledge}
      initialConversations={conversations}
    />
  );
}
