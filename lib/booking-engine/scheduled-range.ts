/**
 * Compare customer-visible appointment instants so a notes-only Reception
 * save does not look like a reschedule when ISO formatting differs
 * (+00:00 vs Z). A real difference in start OR end is a range change.
 */
export function scheduledInstantChanged(
  existing: unknown,
  requested: string,
): boolean {
  if (typeof existing !== "string" || !existing.trim()) {
    return Boolean(requested);
  }
  if (!requested) return true;

  const left = Date.parse(existing);
  const right = Date.parse(requested);
  if (Number.isNaN(left) || Number.isNaN(right)) {
    return existing !== requested;
  }
  return left !== right;
}

export function scheduledRangeChanged(input: {
  existingStart: unknown;
  requestedStart: string;
  existingEnd: unknown;
  requestedEnd: string;
}): boolean {
  return (
    scheduledInstantChanged(input.existingStart, input.requestedStart) ||
    scheduledInstantChanged(input.existingEnd, input.requestedEnd)
  );
}
