// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
const mocks = vi.hoisted(() => ({ client: null as unknown, fetch: vi.fn(), claim: vi.fn(), finalize: vi.fn(), send: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => mocks.client }));
vi.mock("@/lib/integrations/jobs/claim", async importOriginal => ({ ...await importOriginal<object>(), claimBackgroundJob: mocks.claim, finalizeClaimedJob: mocks.finalize }));
vi.mock("@/lib/communications", () => ({ sendEmail: mocks.send, sendSMS: mocks.send, computeBackoffMs: () => 1000 }));
vi.mock("@/lib/observability/logger", () => ({ logger: { info: mocks.info, warn: mocks.warn, error: mocks.error } }));
vi.mock("@/lib/notifications/booking-delivery", () => ({ loadAppointmentNotifyContext: vi.fn() }));
vi.mock("@/lib/integrations/calendar/sync", () => ({ syncCalendarConnection: vi.fn() }));
vi.mock("@/lib/integrations/automation/recurring", () => ({ generateRecurringOccurrences: vi.fn() }));
vi.mock("@/lib/integrations/automation/waitlist", () => ({ notifyWaitlistForSlot: vi.fn() }));
vi.mock("@/lib/integrations/webhooks/dispatch", () => ({ dispatchWebhooks: vi.fn() }));
import { GET } from "@/app/api/cron/process-jobs/route";
import { processPendingJobs, selectPendingJobCandidates } from "@/lib/integrations/jobs/processor";
import { classifyCandidateFailure, CANDIDATE_TIMEOUT_MS } from "@/lib/integrations/jobs/candidate-selection";
import { resetRateLimitStore } from "@/lib/security/rate-limit";
const response = (data: unknown = [], status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const gateway = () => response({ message: "Gateway Timeout", code: "", details: "", hint: "" }, 504);
const urls = () => mocks.fetch.mock.calls.map(c => new URL(String(c[0])));
beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers(); resetRateLimitStore();
  vi.stubEnv("CHASUM_WORKER_RELIABILITY_ENABLED", "true"); vi.stubEnv("CHASUM_WORKER_WEBHOOKS_ENABLED", "false");
  vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("CRON_SECRET", "synthetic-secret");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected external fetch"); }));
  mocks.client = createClient("https://synthetic.invalid", "synthetic-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: mocks.fetch } });
  mocks.claim.mockResolvedValue(null);
});
afterEach(() => { expect(vi.getTimerCount()).toBe(0); vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
async function settle<T>(operation: Promise<T>): Promise<T> { const guarded = operation.then(value => ({value}), error => ({error})); await vi.runAllTimersAsync(); const result = await guarded; if ('error' in result) throw result.error; return result.value; }
describe("real PostgREST builder / candidate retry / real Cron route", () => {
  it("successful selection preserves rows with one GET and no retry", async () => {
    const rows = [{ id: "synthetic" }]; mocks.fetch.mockResolvedValueOnce(response(rows));
    expect(await settle(selectPendingJobCandidates(mocks.client as ReturnType<typeof createClient>))).toEqual(rows);
    expect(mocks.fetch).toHaveBeenCalledTimes(1); expect(mocks.warn).not.toHaveBeenCalled(); expect(mocks.info).not.toHaveBeenCalled();
  });
  it("fault injection: Gateway Timeout then empty yields real route HTTP 200 without claim or send", async () => {
    mocks.fetch.mockResolvedValueOnce(gateway()).mockResolvedValueOnce(response());
    const result = await settle(GET(new Request("https://synthetic.invalid/api/cron/process-jobs", { headers: { authorization: "Bearer synthetic-secret" } })));
    expect(result.status).toBe(200); expect(await result.json()).toMatchObject({processed: 0});
    expect(mocks.fetch).toHaveBeenCalledTimes(2); expect(urls()[0].search).toBe(urls()[1].search);
    for (const [url, options] of mocks.fetch.mock.calls) { expect(options.method).toBe("GET"); expect(new URL(url).searchParams.get('job_type')).toBe('neq.webhook'); }
    expect(mocks.claim).not.toHaveBeenCalled(); expect(mocks.finalize).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.warn).toHaveBeenCalledWith('worker','candidate_selection_retry',expect.objectContaining({attempt:1,willRetry:true}));
    expect(mocks.info).toHaveBeenCalledWith('worker','candidate_selection_recovered',expect.objectContaining({attempt:2,recovered:true}));
  });
  it("retry candidates reach claim once, only after successful selection", async () => {
    const job = {id:'synthetic'}; mocks.fetch.mockResolvedValueOnce(gateway()).mockImplementationOnce(() => { expect(mocks.claim).not.toHaveBeenCalled(); return Promise.resolve(response([job])); });
    expect(await settle(processPendingJobs())).toBe(0); expect(mocks.fetch).toHaveBeenCalledTimes(2); expect(mocks.claim).toHaveBeenCalledExactlyOnceWith(mocks.client,job);
  });
  it("two gateways exhaust exactly two HTTP reads, reject route, never claim/send", async () => {
    mocks.fetch.mockImplementation(gateway);
    await expect(settle(GET(new Request('https://synthetic.invalid', {headers:{authorization:'Bearer synthetic-secret'}})))).rejects.toThrow('candidate selection failed');
    expect(mocks.fetch).toHaveBeenCalledTimes(2); expect(mocks.claim).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith('worker','candidate_selection_failed',expect.objectContaining({attempt:2,exhausted:true,willRetry:false}));
  });
  it.each(['42703','42501','42601','22P02','23505','PGRST204'])('semantic error %s fails immediately', async code => {
    mocks.fetch.mockResolvedValue(response({code,message:'private upstream details'},400));
    await expect(settle(processPendingJobs())).rejects.toThrow('database_error'); expect(mocks.fetch).toHaveBeenCalledTimes(1); expect(mocks.warn).not.toHaveBeenCalled(); expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith('worker','candidate_selection_failed',expect.objectContaining({attempt:1,transient:false}));
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain('private upstream details');
  });
  it("webhook ON preserves inclusion across both attempts", async () => {
    vi.stubEnv('CHASUM_WORKER_WEBHOOKS_ENABLED','true'); mocks.fetch.mockResolvedValueOnce(gateway()).mockResolvedValueOnce(response());
    await settle(processPendingJobs()); expect(mocks.fetch).toHaveBeenCalledTimes(2); for(const url of urls()) expect(url.searchParams.has('job_type')).toBe(false);
  });
  it("claim failure never re-enters selection", async () => {
    mocks.fetch.mockResolvedValueOnce(response([{id:'synthetic'}])); mocks.claim.mockRejectedValueOnce(new Error('claim uncertainty'));
    await expect(settle(processPendingJobs())).rejects.toThrow('claim uncertainty'); expect(mocks.fetch).toHaveBeenCalledTimes(1); expect(mocks.claim).toHaveBeenCalledTimes(1); expect(mocks.warn).not.toHaveBeenCalled();
  });
  const hang = (_url: unknown, options: RequestInit) => new Promise<Response>((_, reject) => options.signal!.addEventListener('abort', () => reject(new DOMException('aborted','AbortError')), {once:true}));
  it("first timeout aborts its request; second succeeds with cleaned timers", async () => {
    mocks.fetch.mockImplementationOnce(hang).mockResolvedValueOnce(response());
    expect(await settle(processPendingJobs())).toBe(0); expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.fetch.mock.calls[0][1].signal.aborted).toBe(true); expect(mocks.fetch.mock.calls[1][1].signal.aborted).toBe(false);
    expect(mocks.warn).toHaveBeenCalledWith('worker','candidate_selection_retry',expect.objectContaining({classification:'selection_timeout',latencyMs:CANDIDATE_TIMEOUT_MS}));
  });
  it("two timeouts fail loud without claim or dangling timers", async () => {
    mocks.fetch.mockImplementation(hang); await expect(settle(processPendingJobs())).rejects.toThrow('selection_timeout'); expect(mocks.fetch).toHaveBeenCalledTimes(2); expect(mocks.claim).not.toHaveBeenCalled();
  });
  it("network rejection is retried once, without hidden SDK retries", async () => {
    mocks.fetch.mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValueOnce(response()); expect(await settle(processPendingJobs())).toBe(0); expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });
});
describe('narrow classification', () => {
  it.each([400,401,403,404,409,422])('HTTP %s never retries misleading gateway text', status => expect(classifyCandidateFailure({message:'Gateway Timeout'},status).transient).toBe(false));
  it.each([502,503,504])('upstream HTTP %s is transient', status => expect(classifyCandidateFailure({message:'upstream'},status).transient).toBe(true));
  it.each(['ECONNRESET','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT'])('%s transport code', code => expect(classifyCandidateFailure({cause:{code}}).transient).toBe(true));
  it.each([new Error('programming bug'), {code:'42501',message:'Gateway Timeout'}, {message:'permission denied'}, {message:'invalid enum'}, {message:'Gateway Timeout for customer secret'}])('does not broaden message matches', error => expect(classifyCandidateFailure(error).transient).toBe(false));
});
