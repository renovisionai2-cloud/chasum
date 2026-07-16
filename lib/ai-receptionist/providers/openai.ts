import { knowledgeToPromptBlock } from "@/lib/ai-receptionist/knowledge";
import type {
  ReceptionistAiProvider,
  ReceptionistProviderInput,
  ReceptionistProviderResult,
} from "@/lib/ai-receptionist/providers/types";
import { getOpenAiApiKey } from "@/lib/env";

/**
 * Optional OpenAI provider. Falls back is handled by getReceptionistProvider().
 * Still requires grounded knowledge in the system prompt — no invented facts.
 */
export class OpenAiReceptionistProvider implements ReceptionistAiProvider {
  readonly name = "openai";
  readonly ready: boolean;

  constructor(private apiKey: string) {
    this.ready = Boolean(apiKey);
  }

  async complete(
    input: ReceptionistProviderInput,
  ): Promise<ReceptionistProviderResult> {
    const knowledgeBlock = knowledgeToPromptBlock(input.knowledge);
    const slotBlock =
      input.suggestedSlots.length > 0
        ? input.suggestedSlots
            .map(
              (s) =>
                `${s.date} ${s.timeLabel} — ${s.serviceName} with ${s.staffName}`,
            )
            .join("\n")
        : "No open slots returned by the scheduling engine.";

    const system = `You are Emma, the Chasum AI Receptionist for ${input.knowledge.businessName}.
You are an AI employee — not a generic chatbot.
Answer ONLY using the business knowledge and availability below.
Never invent hours, prices, staff, policies, or appointment times.
If information is missing, say so and offer to escalate to staff.
When recommending times, use only the availability list.
Keep replies concise and professional.
Voice calling is not available yet.

BUSINESS KNOWLEDGE:
${knowledgeBlock}

REAL AVAILABILITY (from scheduling engine):
${slotBlock}

Detected intent: ${input.intent}`;

    const messages = [
      { role: "system", content: system },
      ...input.history.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: input.message },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_RECEPTIONIST_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "I had trouble forming a reply. Please ask again or request staff.";

    const escalate =
      input.intent === "escalate" ||
      /\b(escalate|team member|staff will|human)\b/i.test(reply);

    return {
      provider: this.name,
      reply,
      escalate,
      citations: [
        { source: "services", label: "Business knowledge" },
        { source: "availability", label: "Scheduling engine" },
      ],
    };
  }
}

export function tryCreateOpenAiProvider(): OpenAiReceptionistProvider | null {
  const key = getOpenAiApiKey();
  if (!key) return null;
  return new OpenAiReceptionistProvider(key);
}
