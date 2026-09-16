/**
 * Compare appointment start instants so a notes-only Reception save does not
 * look like a reschedule when ISO formatting differs (+00:00 vs Z).
 */
export function scheduledStartChanged(
  existingStart: unknown,
  requestedStart: string,
): boolean {
  if (typeof existingStart !== "string" || !existingStart.trim()) {
    return Boolean(requestedStart);
  }
  if (!requestedStart) return true;

  const left = Date.parse(existingStart);
  const right = Date.parse(requestedStart);
  if (Number.isNaN(left) || Number.isNaN(right)) {
    return existingStart !== requestedStart;
  }
  return left !== right;
}
