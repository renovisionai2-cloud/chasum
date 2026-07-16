export type {
  BusinessKnowledge,
  ReceptionistConversation,
  ReceptionistIntent,
  ReceptionistMessage,
  ReceptionistTurnResult,
  SuggestedSlot,
} from "@/lib/ai-receptionist/types";

export { loadBusinessKnowledge, knowledgeToPromptBlock } from "@/lib/ai-receptionist/knowledge";
export { detectReceptionistIntent } from "@/lib/ai-receptionist/intents";
export {
  getAiReceptionistService,
  AiReceptionistService,
} from "@/lib/ai-receptionist/service";
export { getReceptionistProvider } from "@/lib/ai-receptionist/providers";
