/** Shared with Stage 1C Add Location; deliberately no random/collision suffix. */
export function locationSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}
