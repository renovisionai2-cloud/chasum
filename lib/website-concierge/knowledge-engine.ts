import { getKnowledgeById, KNOWLEDGE_CATALOG } from "@/lib/website-concierge/knowledge/catalog";
import { TOUR_STEPS } from "@/lib/website-concierge/knowledge/tour";
import type {
  KnowledgeIntent,
  KnowledgeRetrieval,
  RankedKnowledgeEntry,
} from "@/lib/website-concierge/knowledge/types";
import type {
  BusinessType,
  ConciergeMessage,
  SessionMemory,
} from "@/lib/website-concierge/types";

export type KnowledgeEngineInput = {
  query: string;
  memory: SessionMemory;
  recentMessages: ConciergeMessage[];
};

export type KnowledgeEngineResult = {
  retrieval: KnowledgeRetrieval;
  message: string;
  suggestions: string[];
  memoryPatch: Partial<
    Pick<
      SessionMemory,
      | "businessType"
      | "visitorName"
      | "interests"
      | "answeredArticleIds"
      | "tourStepId"
      | "lastTopicIds"
    >
  >;
};

const STOP = new Set([
  "the",
  "and",
  "for",
  "you",
  "your",
  "with",
  "that",
  "this",
  "what",
  "how",
  "are",
  "is",
  "can",
  "about",
  "tell",
  "me",
  "please",
  "just",
]);

/**
 * Retrieve + compose — providers (placeholder or future LLM) consume this output.
 * UI never hardcodes product answers.
 */
export function runKnowledgeEngine(
  input: KnowledgeEngineInput,
): KnowledgeEngineResult {
  const query = input.query.trim();
  const intent = detectIntent(query, input.memory);

  if (intent === "tour" || isTourAdvance(query) || input.memory.tourStepId) {
    const tour = advanceTour(query, input.memory);
    if (tour) return tour;
  }

  const retrieval = retrieveKnowledge({
    query,
    intent,
    memory: input.memory,
  });

  return composeFromRetrieval({
    retrieval,
    memory: input.memory,
    recentMessages: input.recentMessages,
  });
}

export function retrieveKnowledge(input: {
  query: string;
  intent: KnowledgeIntent;
  memory: SessionMemory;
  limit?: number;
}): KnowledgeRetrieval {
  const { query, intent, memory, limit = 3 } = input;
  const tokens = tokenize(query);
  const answered = new Set(memory.answeredArticleIds ?? []);

  const scored: RankedKnowledgeEntry[] = KNOWLEDGE_CATALOG.map((entry) => {
    let score = 0;
    if (categoryMatchesIntent(entry.category, intent)) score += 4;

    for (const tag of entry.tags) {
      if (tokens.some((t) => tag.includes(t) || t.includes(tag))) score += 3;
    }

    const hay = `${entry.title} ${entry.summary} ${entry.body}`.toLowerCase();
    for (const t of tokens) {
      if (hay.includes(t)) score += 1;
    }

    if (
      memory.businessType !== "unknown" &&
      entry.industries?.includes(memory.businessType)
    ) {
      score += 5;
    }

    // Prefer fresh articles when the visitor already heard one.
    if (answered.has(entry.id)) score -= 6;
    if ((memory.lastTopicIds ?? []).includes(entry.id)) score -= 3;

    return { entry, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const hits = scored.slice(0, limit);
  const top = hits[0]?.score ?? 0;
  const confidence: KnowledgeRetrieval["confidence"] =
    top >= 8 ? "high" : top >= 4 ? "medium" : "low";

  return {
    intent,
    query,
    hits,
    confidence,
    unknown: hits.length === 0 || confidence === "low",
  };
}

function composeFromRetrieval(input: {
  retrieval: KnowledgeRetrieval;
  memory: SessionMemory;
  recentMessages: ConciergeMessage[];
}): KnowledgeEngineResult {
  const { retrieval, memory } = input;

  if (retrieval.unknown || retrieval.hits.length === 0) {
    const recommendation = recommendTopic(memory);
    return {
      retrieval,
      message: [
        "I’m not confident I have that exact answer in my Knowledge Engine yet.",
        recommendation
          ? `I can go deeper on ${recommendation.title} instead — or ask about pricing, industries, or a two-minute tour.`
          : "Try asking about a feature (booking, CRM, payments), an industry, pricing, or say “start the tour.”",
      ].join(" "),
      suggestions: [
        recommendation?.title ?? "What is Chasum?",
        "Start the tour",
        "Show pricing",
      ],
      memoryPatch: {
        interests: ["unknown-question"],
      },
    };
  }

  const primary = retrieval.hits[0]!.entry;
  const secondary = retrieval.hits[1]?.entry;
  const alreadyCovered = (memory.answeredArticleIds ?? []).includes(primary.id);

  const parts: string[] = [];
  if (alreadyCovered) {
    parts.push(
      `Quick refresh without repeating the full pitch: ${primary.summary}`,
    );
    if (secondary && !(memory.answeredArticleIds ?? []).includes(secondary.id)) {
      parts.push(`Related: ${secondary.body}`);
    } else {
      parts.push(primary.body);
    }
  } else {
    parts.push(primary.body);
    if (secondary && secondary.category !== primary.category) {
      parts.push(secondary.summary);
    }
  }

  const followUp =
    primary.followUps?.[0] ??
    secondary?.followUps?.[0] ??
    "Would you like a two-minute product tour?";

  parts.push(followUp);

  const answeredArticleIds = unique([
    ...(memory.answeredArticleIds ?? []),
    primary.id,
    ...(secondary ? [secondary.id] : []),
  ]).slice(-24);

  const suggestions = unique([
    ...(primary.followUps ?? []).slice(0, 2),
    secondary?.followUps?.[0] ?? "Start the tour",
    "Show pricing",
  ]).slice(0, 3);

  return {
    retrieval,
    message: parts.filter(Boolean).join(" "),
    suggestions,
    memoryPatch: {
      answeredArticleIds,
      lastTopicIds: [primary.id, ...(secondary ? [secondary.id] : [])],
      interests: [primary.category, ...(primary.tags.slice(0, 2) ?? [])],
    },
  };
}

function advanceTour(
  query: string,
  memory: SessionMemory,
): KnowledgeEngineResult | null {
  const lower = query.toLowerCase();
  const wantsTour =
    /\b(tour|walk\s*me|guide\s*me|two[- ]?minute|show\s+me\s+chasum)\b/i.test(
      lower,
    ) ||
    /\b(start\s+the\s+tour|begin\s+the\s+tour)\b/i.test(lower);
  const wantsNext =
    /^(next|continue|go on|keep going)\b/i.test(lower.trim()) ||
    /\b(next\s*:|next\s+step|next\s+please)\b/i.test(lower) ||
    /\bnext:\s*/i.test(lower);

  const onTour = !!memory.tourStepId && memory.tourStepId !== "complete";

  if (!wantsTour && !wantsNext && !onTour) return null;
  if (!wantsTour && !wantsNext && memory.tourStepId === "complete") return null;
  // Mid-tour unrelated questions fall through to normal retrieval.
  if (!wantsTour && !wantsNext && onTour) return null;

  let stepIndex = 0;
  const currentIdx = TOUR_STEPS.findIndex((s) => s.id === memory.tourStepId);

  if (/\bai vision\b/i.test(lower) || /\bskip to ai\b/i.test(lower)) {
    stepIndex = TOUR_STEPS.findIndex((s) => s.id === "ai-vision");
  } else if (wantsTour && (!memory.tourStepId || memory.tourStepId === "complete")) {
    stepIndex = 0;
  } else if (wantsTour) {
    stepIndex = 0; // restart
  } else if (wantsNext && currentIdx >= 0) {
    stepIndex = Math.min(currentIdx + 1, TOUR_STEPS.length - 2); // stop at ai-vision
  }

  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0]!;
  const entry = getKnowledgeById(step.knowledgeId);
  if (!entry) return null;

  const isLast = step.id === "ai-vision";
  const message = [
    `Tour · ${step.title}:`,
    entry.body,
    isLast
      ? "That’s the core loop — Dashboard → Booking → CRM → Payments → Reports → AI. Want pricing or Private Alpha next?"
      : `Say “next” for ${TOUR_STEPS[stepIndex + 1]?.title ?? "the next stop"}.`,
  ].join(" ");

  return {
    retrieval: {
      intent: "tour",
      query,
      hits: [{ entry, score: 100 }],
      confidence: "high",
      unknown: false,
    },
    message,
    suggestions: isLast
      ? ["Show pricing", "Apply for Private Alpha", "Ask anything else"]
      : [step.nextPrompt, "Skip to AI vision", "Show pricing"],
    memoryPatch: {
      tourStepId: isLast ? "complete" : step.id,
      answeredArticleIds: unique([
        ...(memory.answeredArticleIds ?? []),
        entry.id,
      ]),
      lastTopicIds: [entry.id],
      interests: ["tour", step.id],
    },
  };
}

function detectIntent(query: string, memory: SessionMemory): KnowledgeIntent {
  const q = query.toLowerCase();
  if (/\b(tour|walk\s*me|guide|two[- ]?minute)\b/.test(q)) return "tour";
  if (
    /\b(fresha|vagaro|jane|gloss|boulevard|booksy|square|mindbody|vs\b|versus|compar|alternative|differ)\b/.test(
      q,
    )
  ) {
    return "competitive";
  }
  if (/\b(price|pricing|plan|cost|subscription|\$|upgrade|trial)\b/.test(q)) {
    return "pricing";
  }
  if (
    /\b(security|privacy|import|mobile|support|customiz|data ownership|gdpr|who owns)\b/.test(
      q,
    )
  ) {
    return "faq";
  }
  if (
    /\b(ultrasound|salon|spa|massage|chiro|physio|dental|vet|groom|barber|industry)\b/.test(
      q,
    ) ||
    (memory.businessType !== "unknown" &&
      /\b(for my|my business|we run|i run)\b/.test(q))
  ) {
    return "industry";
  }
  if (
    /\b(booking|crm|calendar|payment|deposit|gift|package|report|employee|staff|location|portal|ai|summer|chase)\b/.test(
      q,
    )
  ) {
    return "feature";
  }
  if (/\b(mission|vision|why|story|operating system|chasum|what is)\b/.test(q)) {
    return "company";
  }
  return "unknown";
}

function categoryMatchesIntent(
  category: string,
  intent: KnowledgeIntent,
): boolean {
  if (intent === "unknown") return false;
  if (intent === "feature") return category === "features";
  if (intent === "industry") return category === "industries";
  if (intent === "company") return category === "company";
  if (intent === "pricing") return category === "pricing";
  if (intent === "competitive") return category === "competitive";
  if (intent === "faq") return category === "faq";
  if (intent === "tour") return category === "tour";
  return false;
}

function isTourAdvance(query: string): boolean {
  return /^(next|continue|go on)\b/i.test(query.trim());
}

function recommendTopic(memory: SessionMemory) {
  const answered = new Set(memory.answeredArticleIds ?? []);
  return (
    KNOWLEDGE_CATALOG.find(
      (e) =>
        e.category === "company" &&
        !answered.has(e.id) &&
        e.id === "company-mission",
    ) ||
    KNOWLEDGE_CATALOG.find((e) => !answered.has(e.id) && e.category === "features")
  );
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9$]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/** Map marketing business types used in memory inference */
export function industryKeyFromBusinessType(
  type: BusinessType,
): string | undefined {
  if (type === "unknown" || type === "other" || type === "consulting") {
    return undefined;
  }
  if (type === "clinic") return "chiropractic";
  if (type === "fitness") return "spa";
  return type;
}
