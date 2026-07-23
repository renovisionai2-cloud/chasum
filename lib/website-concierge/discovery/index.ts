export type {
  DiscoveryExtraction,
  DiscoveryField,
  DiscoveryFieldId,
  DiscoveryFollowUpId,
  DiscoveryPhase,
  DiscoveryProfileView,
  DiscoveryTurnResult,
} from "@/lib/website-concierge/discovery/types";

export {
  DISCOVERY_FIELDS,
  fieldById,
  isFieldKnown,
  knownFieldCount,
} from "@/lib/website-concierge/discovery/fields";

export {
  extractDiscoveryFacts,
  looksLikeProductQuestion,
  looksLikeTourRequest,
} from "@/lib/website-concierge/discovery/extract";

export {
  selectNextDiscoveryField,
  shouldOfferRecommendations,
  shouldOfferTour,
} from "@/lib/website-concierge/discovery/next-question";

export {
  buildPersonalizedRecommendations,
  buildRecommendationQuery,
  formatRecommendationsMessage,
  playbookForBusinessType,
} from "@/lib/website-concierge/discovery/recommendations";

export {
  applyDiscoveryExtraction,
  runDiscoveryEngine,
  toDiscoveryProfile,
} from "@/lib/website-concierge/discovery/engine";
