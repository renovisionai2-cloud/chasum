/** Conservative HTTP rejection allowlist. Timeout/conflict/5xx are ambiguous. */
export function confirmedProviderRejection(status: number): boolean {
  return [400, 401, 403, 404, 405, 413, 415, 422, 429].includes(status);
}
