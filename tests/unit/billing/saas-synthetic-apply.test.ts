// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { applySynthetic, receiveSynthetic, readSyntheticRevision, scanSyntheticRecovery,
  type SyntheticDatabase, type SyntheticEnvelope, type SyntheticSnapshot } from "@/lib/billing/saas-synthetic-apply";
const envelope: SyntheticEnvelope = { account: "synthetic", livemode: false, event_id: "event'1",
  type: "subscription.updated", customer_id: "customer", subscription_id: "subscription" };
const snapshot: SyntheticSnapshot = { account: "synthetic", livemode: false, customer_id: "customer",
  subscription_id: "subscription", price_id: "price", status: "active", period_start: null, period_end: null };
function database(rows: Record<string, unknown>[]) {
  return { query: vi.fn().mockResolvedValue({ rows }) } satisfies SyntheticDatabase;
}
describe("trusted synthetic SQL seam", () => {
  it("durably receives with parameterized immutable envelope", async () => {
    const db = database([{outcome:"RECEIVED"}]);
    expect(await receiveSynthetic(db,envelope)).toBe("RECEIVED");
    expect(db.query).toHaveBeenCalledWith("select public.saas_receive($1::jsonb) as outcome",[JSON.stringify(envelope)]);
  });
  it.each(["RETRY_REQUIRED","BLOCKED","APPLIED","IGNORED","ENVELOPE_MISMATCH","RECEIPT_REQUIRED"])("preserves %s without treating receipt as success", async result => {
    const db=database([{outcome:result}]);
    expect(await applySynthetic(db,envelope,snapshot,"9007199254740993")).toBe(result);
    expect(db.query.mock.calls[0][1]).toEqual([JSON.stringify(envelope),JSON.stringify(snapshot),"9007199254740993"]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
  it("refuses invalid revision before SQL",async()=>{
    const db=database([]);
    for(const revision of ["-1","1.1","1;drop table businesses",""])
      await expect(applySynthetic(db,envelope,snapshot,revision)).rejects.toThrow("Invalid subscription revision");
    expect(db.query).not.toHaveBeenCalled();
  });
  it("does not translate database failure into completion",async()=>{
    const db=database([]); db.query.mockRejectedValue(new Error("connection lost"));
    await expect(applySynthetic(db,envelope,snapshot,"1")).rejects.toThrow("connection lost");
  });
  it("fails closed on malformed result",async()=>{
    await expect(receiveSynthetic(database([]),envelope)).rejects.toThrow("Invalid synthetic apply result");
  });
  it("reads revision only through DB identity and preserves bigint precision",async()=>{
    const db=database([{revision:"9007199254740993"}]);
    expect(await readSyntheticRevision(db,envelope)).toBe("9007199254740993");
    expect(db.query.mock.calls[0][1]).toEqual(["synthetic",false,"subscription","customer"]);
    expect(await readSyntheticRevision(database([]),envelope)).toBeNull();
  });
  it("recovery scan includes received, retryable and blocked work",async()=>{
    const rows=[{envelope,state:"RECEIVED"}], db=database(rows);
    expect(await scanSyntheticRecovery(db)).toBe(rows);
    expect(db.query.mock.calls[0][0]).toContain("('RECEIVED','RETRY_REQUIRED','BLOCKED')");
    expect(db.query.mock.calls[0][0]).toContain("limit 100");
  });
});
