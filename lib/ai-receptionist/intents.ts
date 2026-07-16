import type { ReceptionistIntent } from "@/lib/ai-receptionist/types";

const RULES: Array<{ intent: ReceptionistIntent; patterns: RegExp[] }> = [
  {
    intent: "escalate",
    patterns: [
      /\b(speak|talk|human|person|manager|complaint|urgent|emergency|escalate)\b/i,
      /\b(someone|staff|receptionist)\b.*\b(please|now)\b/i,
    ],
  },
  {
    intent: "availability",
    patterns: [
      /\b(available|availability|open slot|opening|when can|free time)\b/i,
      /\b(next (week|available)|soonest|recommend.*(time|slot))\b/i,
    ],
  },
  {
    intent: "booking",
    patterns: [
      /\b(book|booking|schedule|appoint|reserve|make an appointment)\b/i,
    ],
  },
  {
    intent: "hours",
    patterns: [
      /\b(hours|open|close|closing|opening time|what time.*(open|close))\b/i,
    ],
  },
  {
    intent: "services",
    patterns: [
      /\b(service|services|offer|menu|price|cost|how much|treatment)\b/i,
    ],
  },
  {
    intent: "employees",
    patterns: [
      /\b(staff|employee|employees|who works|therapist|doctor|provider|stylist)\b/i,
    ],
  },
  {
    intent: "locations",
    patterns: [
      /\b(location|locations|address|where are you|directions|which (site|branch))\b/i,
    ],
  },
  {
    intent: "policy",
    patterns: [
      /\b(cancel|cancellation|policy|policies|refund|deposit|late)\b/i,
    ],
  },
  {
    intent: "greeting",
    patterns: [/^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/i],
  },
];

export function detectReceptionistIntent(message: string): ReceptionistIntent {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(message))) return rule.intent;
  }
  return "general";
}

export function wantsEscalation(message: string): boolean {
  return detectReceptionistIntent(message) === "escalate";
}
