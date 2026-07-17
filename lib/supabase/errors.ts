/** Helpers for PostgREST / Supabase schema errors. */

export function isMissingSchemaError(message: string | null | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find the table") ||
    m.includes("could not find the relation")
  );
}

/** Log schema gaps at warn; real failures at error. */
export function logQueryError(scope: string, message: string): void {
  if (isMissingSchemaError(message)) {
    console.warn(`[${scope}] schema not ready:`, message);
    return;
  }
  console.error(`[${scope}]`, message);
}
