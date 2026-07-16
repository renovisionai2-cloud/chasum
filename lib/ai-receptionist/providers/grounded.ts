import type {
  ReceptionistAiProvider,
  ReceptionistProviderInput,
  ReceptionistProviderResult,
} from "@/lib/ai-receptionist/providers/types";
import type { ReceptionistCitation } from "@/lib/ai-receptionist/types";

/**
 * Grounded rule-based provider — answers only from Chasum business data.
 * Production-ready foundation that works without external LLM keys.
 */
export class GroundedReceptionistProvider implements ReceptionistAiProvider {
  readonly name = "emma_grounded";
  readonly ready = true;

  async complete(
    input: ReceptionistProviderInput,
  ): Promise<ReceptionistProviderResult> {
    const { knowledge, intent, suggestedSlots } = input;
    const citations: ReceptionistCitation[] = [];

    if (intent === "escalate") {
      return {
        provider: this.name,
        escalate: true,
        citations: [],
        reply: `I can connect you with the ${knowledge.businessName} team. I've flagged this conversation for staff follow-up${
          knowledge.phone ? ` — you can also call ${knowledge.phone}` : ""
        }.`,
      };
    }

    if (intent === "greeting") {
      return {
        provider: this.name,
        escalate: false,
        citations: [],
        reply: `Hi — I'm Emma, the AI receptionist for ${knowledge.businessName}. I can help with hours, services, team members, locations, availability, and starting a booking. What do you need?`,
      };
    }

    if (intent === "hours") {
      citations.push({ source: "hours", label: "Business hours" });
      const lines = knowledge.hours.length
        ? knowledge.hours
            .map((h) =>
              h.isOpen
                ? `• ${h.dayLabel}: ${h.openTime}–${h.closeTime}`
                : `• ${h.dayLabel}: closed`,
            )
            .join("\n")
        : "Hours are not configured yet — please ask staff.";
      return {
        provider: this.name,
        escalate: false,
        citations,
        reply: `Here are ${knowledge.businessName}'s hours (${knowledge.timezone}):\n${lines}`,
      };
    }

    if (intent === "services") {
      citations.push({ source: "services", label: "Services catalog" });
      if (!knowledge.services.length) {
        return {
          provider: this.name,
          escalate: true,
          citations,
          reply:
            "I don't see active services configured yet. I'll escalate so the team can help.",
        };
      }
      const lines = knowledge.services
        .slice(0, 12)
        .map(
          (s) =>
            `• ${s.name} — ${s.durationMinutes} min · $${s.price.toFixed(2)}${
              s.category ? ` · ${s.category}` : ""
            }`,
        )
        .join("\n");
      return {
        provider: this.name,
        escalate: false,
        citations,
        reply: `Services at ${knowledge.businessName}:\n${lines}\n\nI can check availability or help you start a booking.`,
      };
    }

    if (intent === "employees") {
      citations.push({ source: "staff", label: "Employee directory" });
      if (!knowledge.employees.length) {
        return {
          provider: this.name,
          escalate: false,
          citations,
          reply: "No active team members are listed for this location yet.",
        };
      }
      const lines = knowledge.employees
        .map((e) => `• ${e.name}${e.title ? ` — ${e.title}` : ""}`)
        .join("\n");
      return {
        provider: this.name,
        escalate: false,
        citations,
        reply: `Team members:\n${lines}`,
      };
    }

    if (intent === "locations") {
      citations.push({ source: "locations", label: "Locations" });
      if (!knowledge.locations.length) {
        return {
          provider: this.name,
          escalate: false,
          citations,
          reply: knowledge.address
            ? `We're at ${knowledge.address}${
                knowledge.phone ? ` · ${knowledge.phone}` : ""
              }.`
            : "Location details aren't configured yet.",
        };
      }
      const lines = knowledge.locations
        .map(
          (l) =>
            `• ${l.name}${l.isDefault ? " (default)" : ""}${
              l.address ? ` — ${l.address}` : ""
            }${l.phone ? ` · ${l.phone}` : ""}`,
        )
        .join("\n");
      return {
        provider: this.name,
        escalate: false,
        citations,
        reply: `Locations:\n${lines}`,
      };
    }

    if (intent === "policy") {
      citations.push({ source: "policy", label: "Policies" });
      const parts = [
        knowledge.cancellationPolicy
          ? `Cancellation: ${knowledge.cancellationPolicy}`
          : null,
        knowledge.bookingPolicy ? `Booking: ${knowledge.bookingPolicy}` : null,
      ].filter(Boolean);
      if (!parts.length) {
        return {
          provider: this.name,
          escalate: true,
          citations,
          reply:
            "I don't have a written policy on file. I'll escalate so a team member can confirm the details.",
        };
      }
      return {
        provider: this.name,
        escalate: false,
        citations,
        reply: parts.join("\n\n"),
      };
    }

    if (intent === "availability" || intent === "booking") {
      citations.push({ source: "availability", label: "Scheduling engine" });
      if (suggestedSlots.length === 0) {
        return {
          provider: this.name,
          escalate: false,
          citations,
          reply: `I checked real availability and didn't find open slots in the next few days. You can still start booking at ${knowledge.bookingUrl}, or ask me to escalate to staff.`,
        };
      }
      const lines = suggestedSlots
        .slice(0, 6)
        .map(
          (s) =>
            `• ${s.date} ${s.timeLabel} — ${s.serviceName} with ${s.staffName}`,
        )
        .join("\n");
      return {
        provider: this.name,
        escalate: false,
        citations,
        reply:
          intent === "booking"
            ? `I can help you start booking. Recommended times from the scheduling engine:\n${lines}\n\nContinue at ${knowledge.bookingUrl}`
            : `Here are recommended times from the scheduling engine (never invented):\n${lines}\n\nSay “book” if you’d like the booking link, or ask for another day.`,
      };
    }

    // general — only answer with known business facts
    const snippets = [
      knowledge.description,
      knowledge.phone ? `Phone: ${knowledge.phone}` : null,
      knowledge.email ? `Email: ${knowledge.email}` : null,
    ].filter(Boolean);

    return {
      provider: this.name,
      escalate: false,
      citations: [],
      reply: snippets.length
        ? `I'm Emma for ${knowledge.businessName}. ${snippets.join(" · ")}\n\nAsk me about hours, services, team, locations, availability, or booking — or say “speak to staff” to escalate.`
        : `I'm Emma for ${knowledge.businessName}. Ask about hours, services, team, locations, availability, or booking. I only answer from your Chasum data.`,
    };
  }
}
