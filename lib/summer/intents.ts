import type { SummerIntent } from "@/lib/summer/types";

const RULES: Array<{ intent: SummerIntent; patterns: RegExp[] }> = [
  {
    intent: "escalate",
    patterns: [
      /\b(speak|talk|human|person|manager|complaint|urgent|emergency|escalate)\b/i,
      /\b(someone|staff|receptionist)\b.*\b(please|now)\b/i,
      /\bi (want|need) (a )?(person|human|staff)\b/i,
    ],
  },
  {
    intent: "cancel",
    patterns: [
      /\b(cancel|cancellation|call off)\b.*\b(appointment|booking|visit)?\b/i,
      /\b(don't|dont|do not) (need|want) (the |my )?(appointment|booking)\b/i,
    ],
  },
  {
    intent: "reschedule",
    patterns: [
      /\b(reschedule|move|change)\b.*\b(appointment|booking|time|visit)?\b/i,
      /\b(different|another) (time|day|slot)\b/i,
    ],
  },
  {
    intent: "availability",
    patterns: [
      /\b(available|availability|open slot|opening|when can|free time)\b/i,
      /\b(next (week|available)|soonest|recommend.*(time|slot))\b/i,
      /\bwho is (free|available)\b/i,
    ],
  },
  {
    intent: "booking",
    patterns: [
      /\b(book|booking|schedule|appoint|reserve|make an appointment)\b/i,
      /\bi('d| would) like to (book|schedule)\b/i,
    ],
  },
  {
    intent: "customer",
    patterns: [
      /\b(my (account|profile|history|appointments|upcoming))\b/i,
      /\b(returning|regular) (customer|client|guest)\b/i,
      /\b(look( |-)up|find) (me|my|customer|client)\b/i,
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
      /\bpreferred (employee|staff|stylist|therapist)\b/i,
    ],
  },
  {
    intent: "locations",
    patterns: [
      /\b(location|locations|address|where are you|directions|which (site|branch))\b/i,
    ],
  },
  {
    intent: "commerce",
    patterns: [
      /\b(balance|outstanding|invoice|receipt|deposit|payment|owe|owing|bill)\b/i,
      /\b(how much (do i|have i)|what (do i )?owe)\b/i,
      /\b(pay(ment)? (status|due)|unpaid)\b/i,
    ],
  },
  {
    intent: "policy",
    patterns: [
      /\b(policy|policies|refund|late fee)\b/i,
      /\bcancellation policy\b/i,
    ],
  },
  {
    intent: "greeting",
    patterns: [/^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/i],
  },
];

export function detectSummerIntent(message: string): SummerIntent {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(message))) return rule.intent;
  }
  return "general";
}

/** Match a service name mentioned in free text against catalog (no invention). */
export function matchServiceFromMessage(
  message: string,
  services: Array<{ id: string; name: string }>,
): { id: string; name: string } | null {
  const lower = message.toLowerCase();
  let best: { id: string; name: string; score: number } | null = null;
  for (const s of services) {
    const name = s.name.toLowerCase();
    if (lower.includes(name) && name.length > 2) {
      const score = name.length;
      if (!best || score > best.score) best = { ...s, score };
    }
  }
  return best ? { id: best.id, name: best.name } : null;
}

export function matchStaffFromMessage(
  message: string,
  employees: Array<{ id: string; name: string }>,
): { id: string; name: string } | null {
  const lower = message.toLowerCase();
  for (const e of employees) {
    const name = e.name.toLowerCase();
    if (name.length > 2 && lower.includes(name)) {
      return { id: e.id, name: e.name };
    }
  }
  return null;
}
