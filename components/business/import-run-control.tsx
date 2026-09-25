"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, CircleStop, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  advanceC3ImportAction,
  cancelC3ImportAction,
  getC3ResultPageAction,
  resumeC3ImportAction,
  retryC3ReminderTakeoverAction,
  startC3ImportAction,
} from "@/lib/actions/import-c3";
import type { C3ResultPage, C3RunSummary } from "@/lib/server/import-c3";

type Props = { initial: { serverNow: string; runs: C3RunSummary[] } };

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function stateLabel(state: C3RunSummary["state"]) {
  return ({
    uploaded: "Uploaded",
    previewed: "Ready",
    committing: "Importing",
    completed: "Completed",
    completed_with_errors: "Completed with issues",
    failed: "Failed",
    cancelled: "Cancelled",
  } as const)[state];
}

function ResultCounts({ run }: { run: C3RunSummary }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[
        ["Created", run.results.created],
        ["Linked", run.results.linked],
        ["Skipped", run.results.skipped],
        ["Blocked", run.results.blocked],
      ].map(([label, value]) => (
        <div key={String(label)} className="rounded-[var(--radius-md)] border border-border p-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function Cutover({ run }: { run: C3RunSummary }) {
  const cutover = run.cutover;
  if (!cutover) return null;
  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
      <div className="flex items-start gap-2">
        {cutover.ready
          ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
        <div>
          <p className="text-sm font-medium">{cutover.ready ? "Ready for cutover" : "Finish setup before cutover"}</p>
          <p className="text-xs text-muted-foreground">
            This status is calculated from current Chasum operating truth, not from the original import snapshot.
          </p>
        </div>
      </div>
      {!cutover.ready ? (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {cutover.blockedRows > 0 ? <p>{cutover.blockedRows} imported rows remain blocked.</p> : null}
          {cutover.unreviewedServices > 0 ? (
            <Link className="text-primary underline-offset-4 hover:underline" href="/dashboard/services">
              Review {cutover.unreviewedServices} imported service setting{cutover.unreviewedServices === 1 ? "" : "s"}
            </Link>
          ) : null}
          {cutover.staffNeedingSetup > 0 ? (
            <Link className="text-primary underline-offset-4 hover:underline" href="/dashboard/employees">
              Configure {cutover.staffNeedingSetup} imported staff schedule{cutover.staffNeedingSetup === 1 ? "" : "s"}
            </Link>
          ) : null}
          {cutover.locationsNeedingHours > 0 ? (
            <Link className="text-primary underline-offset-4 hover:underline" href="/dashboard/locations">
              Configure hours for {cutover.locationsNeedingHours} imported location{cutover.locationsNeedingHours === 1 ? "" : "s"}
            </Link>
          ) : null}
          {cutover.reminderNeedsAttention ? <p>Reminder takeover still needs attention.</p> : null}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        After your final export, avoid parallel edits in the old system. Verify Chasum before switching the old system off.
        Changes made in the old system after export do not automatically transfer.
      </p>
    </div>
  );
}

export function ImportRunControl({ initial }: Props) {
  const router = useRouter();
  const runs = initial.runs;
  const [leases, setLeases] = useState<Record<string, string>>({});
  const [takeover, setTakeover] = useState<Record<string, boolean>>({});
  const [resultPages, setResultPages] = useState<Record<string, C3ResultPage>>({});
  const [resultLoadingRun, setResultLoadingRun] = useState<string | null>(null);
  const [resultErrors, setResultErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = useMemo(
    () => runs.filter((run) => run.state === "previewed" || run.state === "committing"),
    [runs],
  );
  const recent = useMemo(
    () => runs.filter((run) => run.state !== "previewed" && run.state !== "committing"),
    [runs],
  );

  function refreshSoon() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function start(run: C3RunSummary) {
    setMessage(null);
    const result = await startC3ImportAction({
      runId: run.runId,
      reminderTakeover: Boolean(takeover[run.runId]),
    });
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    if ("leaseToken" in result.data) {
      setLeases((current) => ({ ...current, [run.runId]: result.data.leaseToken }));
    }
    setMessage({
      tone: "success",
      text: "Import started. Already committed batches are durable if this session is interrupted.",
    });
    refreshSoon();
  }

  async function advance(run: C3RunSummary) {
    const leaseToken = leases[run.runId];
    if (!leaseToken) return;
    setMessage(null);
    const result = await advanceC3ImportAction({ runId: run.runId, leaseToken });
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    if (!("leaseToken" in result.data)) {
      setLeases((current) => {
        const next = { ...current };
        delete next[run.runId];
        return next;
      });
    }
    setMessage({
      tone: "success",
      text: "Import progress saved. Already committed batches are durable.",
    });
    refreshSoon();
  }

  async function resume(run: C3RunSummary) {
    setMessage(null);
    const result = await resumeC3ImportAction(run.runId);
    if (!result.ok) {
      const suffix = result.retryAt ? ` Safe retry time: ${formatDate(result.retryAt)}.` : "";
      return setMessage({ tone: "error", text: result.error + suffix });
    }
    if ("leaseToken" in result.data) {
      const leaseToken = result.data.leaseToken;
      setLeases((current) => ({ ...current, [run.runId]: leaseToken }));
      setMessage({ tone: "success", text: "Import resumed from the exact frozen review. No committed rows were restarted." });
    }
    refreshSoon();
  }

  async function cancel(run: C3RunSummary) {
    setMessage(null);
    const result = await cancelC3ImportAction(run.runId);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setMessage({ tone: "success", text: "Reviewed import cancelled before commit. No operational rows were imported." });
    refreshSoon();
  }

  async function retryReminders(run: C3RunSummary) {
    setMessage(null);
    const result = await retryC3ReminderTakeoverAction(run.runId);
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    if (result.data.reminderStatus === "needs_attention") {
      setMessage({
        tone: "info",
        text: "Reminder retry was checked safely, but some reminder work still needs attention. Import results were not changed.",
      });
    } else {
      setMessage({ tone: "success", text: "Reminder takeover scheduling retried safely. Import results were not changed." });
    }
    refreshSoon();
  }

  async function loadResultPage(runId: string, page: number) {
    setResultLoadingRun(runId);
    setResultErrors((current) => {
      const next = { ...current };
      delete next[runId];
      return next;
    });
    const result = await getC3ResultPageAction({ runId, page });
    setResultLoadingRun((current) => current === runId ? null : current);
    if (!result.ok) {
      setResultErrors((current) => ({ ...current, [runId]: result.error }));
      return;
    }
    setResultPages((current) => ({ ...current, [runId]: result.data }));
  }

  function renderRun(run: C3RunSummary) {
    const lease = leases[run.runId];
    const leaseStillActive = run.leaseExpiresAt
      ? Date.parse(run.leaseExpiresAt) > Date.parse(initial.serverNow)
      : false;
    const progress = run.totalRows > 0 ? Math.min(100, Math.round((run.committedRows / run.totalRows) * 100)) : 0;
    const resultPage = resultPages[run.runId];
    const resultError = resultErrors[run.runId];
    const resultLoading = resultLoadingRun === run.runId;
    return (
      <Card key={run.runId}>
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">{stateLabel(run.state)} import</CardTitle>
            <Badge variant="outline">{run.sourceSystem}</Badge>
          </div>
          <p className="break-all font-mono text-xs text-muted-foreground">Run {run.runId}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {run.state === "previewed" ? (
            <>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Exact reviewed plan is locked</p>
                  <p className="text-xs text-muted-foreground">
                    Start import will revalidate current Business truth before the first operational write.
                  </p>
                </div>
              </div>
              <label className="flex min-h-11 items-start gap-3 rounded-[var(--radius-md)] border border-border p-3 text-sm">
                <input
                  className="mt-1 h-4 w-4"
                  type="checkbox"
                  checked={Boolean(takeover[run.runId])}
                  onChange={(event) => setTakeover((current) => ({ ...current, [run.runId]: event.target.checked }))}
                />
                <span>
                  <span className="block font-medium">Chasum should send reminders for these imported future appointments.</span>
                  <span className="block text-xs text-muted-foreground">Off by default. This does not send booking confirmations or new-booking messages.</span>
                </span>
              </label>
              <div className="sticky bottom-16 z-10 flex flex-col gap-2 rounded-[var(--radius-md)] border border-border bg-background/95 p-3 backdrop-blur sm:static sm:flex-row">
                <Button className="min-h-11" disabled={isPending} onClick={() => start(run)}>
                  <Play className="h-4 w-4" /> Start import
                </Button>
                <Button className="min-h-11" variant="outline" disabled={isPending} onClick={() => cancel(run)}>
                  <CircleStop className="h-4 w-4" /> Cancel reviewed import
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cancelling here imports no operational rows. Changing a locked review requires a new upload and review.
              </p>
            </>
          ) : null}

          {run.state === "committing" ? (
            <>
              <div className="space-y-2" aria-live="polite" aria-atomic="true">
                <div className="flex items-center justify-between text-sm">
                  <span>{run.committedRows} of {run.totalRows} rows durably committed</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Already committed batches are durable. Closing this page does not roll them back or restart them.
                </p>
              </div>
              {lease ? (
                <Button className="min-h-11" disabled={isPending} onClick={() => advance(run)}>
                  Continue import
                </Button>
              ) : (
                <div className="space-y-2">
                  {leaseStillActive ? (
                    <Alert variant="info">
                      Another session lease is still active. Resume safely after {formatDate(run.leaseExpiresAt)}.
                    </Alert>
                  ) : null}
                  <Button className="min-h-11" disabled={isPending || leaseStillActive} onClick={() => resume(run)}>
                    <RefreshCw className="h-4 w-4" /> Resume import
                  </Button>
                </div>
              )}
            </>
          ) : null}

          {run.state === "cancelled" ? (
            <Alert variant="info">
              This reviewed import was cancelled before operational commit. No operational rows were imported.
              A changed import requires a new upload and review.
            </Alert>
          ) : null}

          {["completed", "completed_with_errors", "failed"].includes(run.state) ? (
            <>
              <ResultCounts run={run} />
              <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Row results</p>
                  <p className="text-xs text-muted-foreground">
                    Durable commit outcomes. Source row keys are opaque import identifiers, not customer names.
                  </p>
                </div>
                {run.results.blocked > 0 ? (
                  <Alert variant="warning">
                    {run.results.blocked} blocked row{run.results.blocked === 1 ? "" : "s"} need review. Reason codes are shown in the row results.
                  </Alert>
                ) : null}
                {!resultPage ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={resultLoading}
                    onClick={() => void loadResultPage(run.runId, 0)}
                  >
                    {resultLoading ? "Loading row results…" : "View row results"}
                  </Button>
                ) : (
                  <div className="space-y-3" aria-live="polite">
                    {resultPage.rows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No committed row outcomes were recorded for this run.</p>
                    ) : (
                      <div className="space-y-2">
                        {resultPage.rows.map((row, index) => (
                          <div
                            key={`${row.entityType}:${row.sourceRowKey}:${index}`}
                            className="rounded-[var(--radius-md)] border border-border/80 p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{row.entityType}</p>
                                <p className="break-all font-mono text-xs text-muted-foreground">
                                  Source row {row.sourceRowKey}
                                </p>
                              </div>
                              <Badge variant="outline">{row.result}</Badge>
                            </div>
                            {row.reasonCodes.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {row.reasonCodes.map((code) => (
                                  <code
                                    key={code}
                                    className="rounded bg-muted px-1.5 py-1 text-[11px] text-muted-foreground"
                                  >
                                    {code}
                                  </code>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        {resultPage.total === 0
                          ? "0 rows"
                          : `Rows ${resultPage.page * resultPage.pageSize + 1}–${Math.min(
                              (resultPage.page + 1) * resultPage.pageSize,
                              resultPage.total,
                            )} of ${resultPage.total}`}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11"
                          disabled={resultLoading || resultPage.page === 0}
                          onClick={() => void loadResultPage(run.runId, resultPage.page - 1)}
                        >
                          Previous rows
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11"
                          disabled={
                            resultLoading
                            || (resultPage.page + 1) * resultPage.pageSize >= resultPage.total
                          }
                          onClick={() => void loadResultPage(run.runId, resultPage.page + 1)}
                        >
                          Next rows
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {resultError ? <Alert variant="destructive">{resultError}</Alert> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Reminder takeover: {run.reminderRequested ? run.reminderStatus.replaceAll("_", " ") : "off"}</span>
                {run.reminderRequested && ["partial", "needs_attention", "pending"].includes(run.reminderStatus) ? (
                  <Button variant="outline" className="min-h-11" disabled={isPending} onClick={() => retryReminders(run)}>
                    Retry reminder setup
                  </Button>
                ) : null}
              </div>
              <Cutover run={run} />
              <Link
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                href="/dashboard/business/import"
              >
                Fix and retry with a new import
              </Link>
            </>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Created {formatDate(run.createdAt)}{run.finishedAt ? ` · finished ${formatDate(run.finishedAt)}` : ""}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (runs.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="governed-imports-heading">
      <div>
        <h2 id="governed-imports-heading" className="text-lg font-semibold">Governed import runs</h2>
        <p className="text-sm text-muted-foreground">
          Start, resume, review results, and finish cutover from durable Chasum import truth.
        </p>
      </div>
      <div aria-live="polite">
        {message ? <Alert variant={message.tone === "error" ? "destructive" : message.tone}>{message.text}</Alert> : null}
      </div>
      {active.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Active</h3>
          {active.map(renderRun)}
        </div>
      ) : null}
      {recent.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Recent</h3>
          {recent.map(renderRun)}
        </div>
      ) : null}
    </section>
  );
}
