/** Opt in only after the separately governed schema and release checks. */
export function workerReliabilityEnabled(): boolean {
  return process.env.CHASUM_WORKER_RELIABILITY_ENABLED === "true";
}
