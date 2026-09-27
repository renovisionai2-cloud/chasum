import "server-only";

/** Internal synthetic seam, deliberately not a Server Action or HTTP adapter.
 * The caller owns a service-role SQL connection. Each query must commit on its
 * own: receipt durability precedes apply; the SQL function owns atomic effects.
 * Capture revision BEFORE fetching a fresh authoritative snapshot. On retry,
 * refetch both; never re-label an old snapshot with a newer revision.
 */
export interface SyntheticDatabase {
  query(sql: string, values: readonly unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}
export interface SyntheticEnvelope {
  account: string;
  livemode: boolean;
  event_id: string;
  type: string;
  customer_id: string;
  subscription_id: string;
  metadata_business_id?: string;
  invoice_id?: string;
  amount_cents?: number;
  currency?: string;
}
export interface SyntheticSnapshot {
  account: string;
  livemode: boolean;
  customer_id: string;
  subscription_id: string;
  price_id: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
}
export type SyntheticOutcome = "RECEIVED" | "RETRY_REQUIRED" | "BLOCKED" | "APPLIED" |
  "IGNORED" | "ENVELOPE_MISMATCH" | "RECEIPT_REQUIRED";

function outcome(rows: Record<string, unknown>[]): SyntheticOutcome {
  const value = rows[0]?.outcome;
  if (!["RECEIVED", "RETRY_REQUIRED", "BLOCKED", "APPLIED", "IGNORED",
    "ENVELOPE_MISMATCH", "RECEIPT_REQUIRED"].includes(String(value))) {
    throw new Error("Invalid synthetic apply result");
  }
  return value as SyntheticOutcome;
}
export async function receiveSynthetic(db: SyntheticDatabase, envelope: SyntheticEnvelope) {
  return outcome((await db.query("select public.saas_receive($1::jsonb) as outcome",
    [JSON.stringify(envelope)])).rows);
}
export async function applySynthetic(db: SyntheticDatabase, envelope: SyntheticEnvelope,
  snapshot: SyntheticSnapshot, expectedRevision: string): Promise<SyntheticOutcome> {
  if (!/^\d+$/.test(expectedRevision)) throw new Error("Invalid subscription revision");
  return outcome((await db.query(
    "select public.saas_apply($1::jsonb, $2::jsonb, $3::bigint) as outcome",
    [JSON.stringify(envelope), JSON.stringify(snapshot), expectedRevision])).rows);
}
export async function readSyntheticRevision(db: SyntheticDatabase, envelope: SyntheticEnvelope) {
  const { rows } = await db.query(`select b.subscription_revision::text as revision
    from public.saas_subscription_mappings m join public.businesses b on b.id=m.business_id
    where m.provider_account=$1 and m.livemode=$2 and m.subscription_id=$3 and m.customer_id=$4`,
  [envelope.account, envelope.livemode, envelope.subscription_id, envelope.customer_id]);
  return rows[0]?.revision == null ? null : String(rows[0].revision);
}
export async function scanSyntheticRecovery(db: SyntheticDatabase) {
  return (await db.query(`select envelope, state, reason from public.saas_billing_events
    where state in ('RECEIVED','RETRY_REQUIRED','BLOCKED')
    order by received_at, provider_account, livemode, event_id limit 100`, [])).rows;
}
