import {
  extractDiscoveryFacts,
  looksLikeProductQuestion,
  looksLikeTourRequest,
} from "@/lib/website-concierge/discovery/extract";
import {
  selectNextDiscoveryField,
  shouldOfferRecommendations,
} from "@/lib/website-concierge/discovery/next-question";
import {
  buildPersonalizedRecommendations,
  buildRecommendationQuery,
  formatRecommendationsMessage,
} from "@/lib/website-concierge/discovery/recommendations";
import { formatDiscoveryAsk } from "@/lib/website-concierge/discovery/summer-principle";
import type {
  DiscoveryFieldId,
  DiscoveryFollowUpId,
  DiscoveryPhase,
  DiscoveryProfileView,
  DiscoveryTurnResult,
} from "@/lib/website-concierge/discovery/types";
import { retrieveKnowledge } from "@/lib/website-concierge/knowledge-engine";
import type { SessionMemory } from "@/lib/website-concierge/types";

export function toDiscoveryProfile(memory: SessionMemory): DiscoveryProfileView {
  return {
    businessType: memory.businessType,
    visitorName: memory.visitorName,
    employeeCount: memory.employeeCount,
    locationCount: memory.locationCount,
    currentSoftware: memory.currentSoftware,
    monthlyVolume: memory.monthlyVolume,
    challenges: memory.challenges,
    goals: memory.goals,
    growthPlans: memory.growthPlans,
    discoveryAskedIds: memory.discoveryAskedIds,
    recommendationsMade: memory.recommendationsMade,
    discoveryPhase: memory.discoveryPhase,
    pendingFollowUpId: memory.pendingFollowUpId,
  };
}

export function applyDiscoveryExtraction(
  memory: SessionMemory,
  text: string,
): SessionMemory {
  const facts = extractDiscoveryFacts(text);
  const challenges = uniqueMerge(memory.challenges, facts.challenges ?? []);
  const goals = uniqueMerge(memory.goals, facts.goals ?? []);
  const interests = uniqueMerge(memory.interests, facts.interests ?? []);

  return {
    ...memory,
    businessType: facts.businessType
      ? (facts.businessType as SessionMemory["businessType"])
      : memory.businessType,
    visitorName:
      facts.visitorName !== undefined ? facts.visitorName : memory.visitorName,
    employeeCount: facts.employeeCount ?? memory.employeeCount,
    locationCount: facts.locationCount ?? memory.locationCount,
    currentSoftware: facts.currentSoftware ?? memory.currentSoftware,
    monthlyVolume: facts.monthlyVolume ?? memory.monthlyVolume,
    challenges,
    goals,
    growthPlans: facts.growthPlans ?? memory.growthPlans,
    interests,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Business Discovery Engine turn — conversational, branching, not a fixed form.
 * `result` is null when Knowledge Engine should own the turn (product Q&A / tour).
 * Memory always includes extractions discovery facts.
 */
export function runDiscoveryEngine(input: {
  userMessage: string;
  memory: SessionMemory;
}): { result: DiscoveryTurnResult | null; memory: SessionMemory } {
  let memory = applyDiscoveryExtraction(input.memory, input.userMessage);
  const text = input.userMessage.trim();
  const factsThisTurn = extractDiscoveryFacts(text);

  // Pending intelligent follow-up (e.g. after naming Picktime)
  if (memory.pendingFollowUpId === "software_improvement") {
    if (text.length > 2 && !looksLikeProductQuestion(text)) {
      memory = {
        ...memory,
        challenges: uniqueMerge(memory.challenges, [
          `improve vs ${memory.currentSoftware ?? "current tool"}`,
        ]),
        interests: uniqueMerge(memory.interests, ["competitive", "migration"]),
        pendingFollowUpId: null,
        discoveryPhase: "discovering",
      };
    }
  }

  // Direct product Q&A / active tour → Knowledge Engine
  if (
    looksLikeProductQuestion(text) ||
    looksLikeTourRequest(text) ||
    memory.tourStepId ||
    memory.discoveryPhase === "touring"
  ) {
    if (looksLikeTourRequest(text) && memory.discoveryPhase !== "touring") {
      memory = {
        ...memory,
        discoveryPhase: "touring",
        pendingFollowUpId: null,
      };
    }
    return { result: null, memory };
  }

  // Open consultant mode — let Knowledge Engine answer freely
  if (memory.discoveryPhase === "open") {
    return { result: null, memory };
  }

  // Fresh software mention → intelligent follow-up
  const softwareJustLearned =
    !!factsThisTurn.currentSoftware &&
    !memory.discoveryAskedIds.includes("current_software");

  if (
    softwareJustLearned &&
    memory.pendingFollowUpId !== "software_improvement" &&
    memory.challenges.length === 0
  ) {
    const ack = acknowledge(memory);
    const software = memory.currentSoftware ?? "your current tool";
    const result: DiscoveryTurnResult = {
      message: formatDiscoveryAsk(
        {
          why: `What you want to improve versus ${software} is more important than a feature list.`,
          helps: "It tells me which gaps actually hurt your day — so I don't recommend noise.",
          willDo: "I'll use that focus to personalize the next recommendations and keep the conversation practical.",
          question: `What would you most like to improve compared with ${software}?`,
        },
        { understand: ack },
      ),
      suggestions: [
        "Fewer no-shows",
        "Less admin time",
        "Better reporting",
        "Online booking",
      ],
      askedFieldId: "current_software",
      pendingFollowUpId: "software_improvement",
      discoveryPhase: "discovering",
    };
    memory = markAsked(memory, "current_software", {
      pendingFollowUpId: "software_improvement",
      discoveryPhase: "discovering",
    });
    return { result, memory };
  }

  // Personalized recommendations + tour offer
  if (shouldOfferRecommendations(toDiscoveryProfile(memory))) {
    const query = buildRecommendationQuery(toDiscoveryProfile(memory));
    const retrieval = retrieveKnowledge({
      query,
      intent: "feature",
      memory,
      limit: 6,
    });
    const articles = retrieval.hits.map((h) => h.entry);
    const recs = buildPersonalizedRecommendations(
      toDiscoveryProfile(memory),
      articles,
      4,
    );
    const message = formatRecommendationsMessage(
      toDiscoveryProfile(memory),
      recs,
    );
    const topicIds = recs.map((r) => r.topicId);
    memory = {
      ...memory,
      recommendationsMade: uniqueMerge(memory.recommendationsMade, topicIds),
      discoveryPhase: "recommending",
      pendingFollowUpId: null,
      interests: uniqueMerge(memory.interests, topicIds),
    };
    return {
      result: {
        message,
        suggestions: [
          "Yes, show me a tour",
          "Tell me more about the first one",
          "What about pricing?",
          "I have another question",
        ],
        discoveryPhase: "recommending",
        recommendationsMade: topicIds,
        offerTour: true,
        knowledgeQuery: query,
      },
      memory,
    };
  }

  // After recommendations, wait for tour / product question (don't keep interrogating)
  if (memory.discoveryPhase === "recommending") {
    return { result: null, memory };
  }

  // Continue discovery — Summer Principle: Understand → Explain → Ask
  const next = selectNextDiscoveryField(toDiscoveryProfile(memory));
  if (next) {
    const ack = acknowledge(memory);
    memory = markAsked(memory, next.id, {
      discoveryPhase: "discovering",
      pendingFollowUpId: null,
    });
    return {
      result: {
        message: formatDiscoveryAsk(next, { understand: ack }),
        suggestions: next.suggestions ?? [
          "Tell me more",
          "Skip for now",
          "What can Chasum do?",
        ],
        askedFieldId: next.id,
        discoveryPhase: "discovering",
      },
      memory,
    };
  }

  // Discovery fields exhausted — open consultant mode
  memory = { ...memory, discoveryPhase: "open" };
  const name = memory.visitorName ? `${memory.visitorName}, ` : "";
  return {
    result: {
      message: `${name}I have a solid picture of your business. Ask me anything about Chasum — features, pricing, how we'd fit your setup — or say if you'd like a personalized tour.`,
      suggestions: [
        "Personalized tour",
        "Show pricing",
        "How is Chasum different?",
        "Private Alpha",
      ],
      discoveryPhase: "open",
    },
    memory,
  };
}

function acknowledge(memory: SessionMemory): string | null {
  const bits: string[] = [];
  if (memory.visitorName) bits.push(`Thanks, ${memory.visitorName}.`);
  if (memory.businessType !== "unknown" && memory.challenges.length) {
    bits.push(
      `Got it — a ${memory.businessType.replace(/_/g, " ")} dealing with ${memory.challenges[0]}.`,
    );
  } else if (memory.businessType !== "unknown") {
    bits.push(
      `Got it — ${memory.businessType.replace(/_/g, " ")}.`,
    );
  } else if (memory.currentSoftware) {
    bits.push(`Noted — you're on ${memory.currentSoftware}.`);
  } else if (memory.employeeCount) {
    bits.push(`Understood — team size around ${memory.employeeCount}.`);
  }
  return bits.length ? bits.join(" ") : null;
}

function markAsked(
  memory: SessionMemory,
  fieldId: DiscoveryFieldId,
  extras?: {
    pendingFollowUpId?: DiscoveryFollowUpId | null;
    discoveryPhase?: DiscoveryPhase;
  },
): SessionMemory {
  const discoveryAskedIds = memory.discoveryAskedIds.includes(fieldId)
    ? memory.discoveryAskedIds
    : [...memory.discoveryAskedIds, fieldId];
  return {
    ...memory,
    discoveryAskedIds,
    pendingFollowUpId:
      extras?.pendingFollowUpId !== undefined
        ? extras.pendingFollowUpId
        : memory.pendingFollowUpId,
    discoveryPhase: extras?.discoveryPhase ?? memory.discoveryPhase,
    updatedAt: new Date().toISOString(),
  };
}

function uniqueMerge(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b].map((s) => s.trim()).filter(Boolean))];
}
