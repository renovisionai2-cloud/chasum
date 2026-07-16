import type {
  BusinessKnowledge,
  ReceptionistCitation,
  ReceptionistIntent,
  SuggestedSlot,
} from "@/lib/ai-receptionist/types";

export type ReceptionistProviderInput = {
  message: string;
  intent: ReceptionistIntent;
  knowledge: BusinessKnowledge;
  suggestedSlots: SuggestedSlot[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
};

export type ReceptionistProviderResult = {
  reply: string;
  citations: ReceptionistCitation[];
  provider: string;
  escalate: boolean;
};

export interface ReceptionistAiProvider {
  readonly name: string;
  readonly ready: boolean;
  complete(input: ReceptionistProviderInput): Promise<ReceptionistProviderResult>;
}
