import {
  DISCOVERY_FIELDS,
  isFieldKnown,
} from "@/lib/website-concierge/discovery/fields";
import type {
  DiscoveryField,
  DiscoveryProfileView,
} from "@/lib/website-concierge/discovery/types";

/**
 * Pick the next discovery question dynamically.
 * Skips known fields, respects skipWhen branching, never re-asks asked ids.
 */
export function selectNextDiscoveryField(
  profile: DiscoveryProfileView,
): DiscoveryField | null {
  const candidates = DISCOVERY_FIELDS.filter((field) => {
    if (profile.discoveryAskedIds.includes(field.id)) return false;
    if (isFieldKnown(field.id, profile)) return false;
    if (field.skipWhen?.(profile)) return false;
    return true;
  });

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.priority - a.priority);

  // Soft branching: if software just learned, prefer challenges next
  if (profile.currentSoftware && !isFieldKnown("challenges", profile)) {
    const challenges = candidates.find((c) => c.id === "challenges");
    if (challenges) return challenges;
  }

  const hasSelectedBusiness =
    profile.businessType !== "unknown" ||
    (profile.businessTypes?.length ?? 0) > 0;

  // If business type known but challenges unknown, surface challenges early
  if (
    hasSelectedBusiness &&
    !isFieldKnown("challenges", profile)
  ) {
    const challenges = candidates.find((c) => c.id === "challenges");
    if (challenges && challenges.priority >= 80) return challenges;
  }

  return candidates[0] ?? null;
}

export function shouldOfferRecommendations(
  profile: DiscoveryProfileView,
): boolean {
  if (profile.recommendationsMade.length > 0) return false;
  const hasType =
    profile.businessType !== "unknown" ||
    (profile.businessTypes?.length ?? 0) > 0;
  const hasSignal =
    profile.challenges.length > 0 ||
    !!profile.currentSoftware ||
    profile.goals.length > 0;
  if (!hasType || !hasSignal) return false;
  // Observe → Understand → Recommend: finish core discovery before pitching.
  const next = selectNextDiscoveryField(profile);
  if (next && next.priority >= 55) return false;
  return true;
}

export function shouldOfferTour(profile: DiscoveryProfileView): boolean {
  if (profile.discoveryPhase === "touring") return false;
  return (
    profile.recommendationsMade.length > 0 ||
    shouldOfferRecommendations(profile)
  );
}
