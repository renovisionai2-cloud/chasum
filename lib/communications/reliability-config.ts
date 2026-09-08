/** Opt in only after the separately governed schema and release checks. */
export function workerReliabilityEnabled(): boolean {
  return process.env.CHASUM_WORKER_RELIABILITY_ENABLED === "true";
}

/**
 * Webhook external dispatch is not covered by communication_send_intents.
 * Absent or any value other than the exact string "true" holds webhook jobs
 * out of the normal queue scan so processPendingJobs cannot claim them.
 * Direct claimBackgroundJob on an explicit row remains available for tests.
 */
export function workerWebhooksEnabled(): boolean {
  return process.env.CHASUM_WORKER_WEBHOOKS_ENABLED === "true";
}
