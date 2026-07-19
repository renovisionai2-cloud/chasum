"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelSummerAppointmentAction,
  confirmSummerBookingAction,
  rescheduleSummerAppointmentAction,
  sendSummerMessage,
} from "@/lib/actions/summer";
import type {
  SummerAppointmentCard,
  SummerBookingOption,
  SummerConflictExplanation,
  SummerTurnResult,
} from "@/lib/summer/types";
import { cn } from "@/lib/utils";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarX2,
  Loader2,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

type ChatLine = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  bookingOptions?: SummerBookingOption[];
  appointmentCards?: SummerAppointmentCard[];
  conflicts?: SummerConflictExplanation[];
  escalated?: boolean;
  confirmation?: string | null;
};

export function SummerReceptionWorkspace({
  businessName,
  knowledgeReady,
}: {
  businessName: string;
  knowledgeReady: {
    serviceCount: number;
    employeeCount: number;
    hoursConfigured: number;
  };
}) {
  const knowledgeGaps: string[] = [];
  if (knowledgeReady.serviceCount === 0) knowledgeGaps.push("services");
  if (knowledgeReady.employeeCount === 0) knowledgeGaps.push("employees");
  if (knowledgeReady.hoursConfigured === 0) knowledgeGaps.push("business hours");
  const knowledgeIncomplete = knowledgeGaps.length > 0;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [recognizedName, setRecognizedName] = useState<string | null>(null);
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatLine[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi — I'm Summer, AI receptionist for ${businessName}. I book, reschedule, and cancel through the Booking Engine, answer from your real business data, and escalate when a human is needed. I never invent times or prices.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([
    "What are your hours?",
    "What services do you offer?",
    "When is the next available appointment?",
    "I'd like to book",
    "I need to speak with staff",
  ]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function nextId(prefix: string) {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }

  function applyTurn(userText: string, result: SummerTurnResult) {
    if (result.conversationId) setConversationId(result.conversationId);
    if (result.customerId) setCustomerId(result.customerId);
    if (result.customerRecognized && result.customerDisplayName) {
      setRecognizedName(result.customerDisplayName);
    }
    if (result.suggestions?.length) setSuggestions(result.suggestions);

    setMessages((prev) => [
      ...prev,
      {
        id: nextId("a"),
        role: "assistant",
        content: result.reply,
        bookingOptions: result.bookingOptions,
        appointmentCards: result.appointmentCards,
        conflicts: result.conflicts,
        escalated: result.escalated,
      },
    ]);
  }

  function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: nextId("u"), role: "user", content: message },
    ]);

    startTransition(async () => {
      try {
        const result = await sendSummerMessage({
          message,
          conversationId,
          visitorName: visitorName || null,
          visitorEmail: visitorEmail || null,
          visitorPhone: visitorPhone || null,
          customerId,
        });
        if (result.conversationId) setConversationId(result.conversationId);
        if (result.customerId) setCustomerId(result.customerId);
        applyTurn(message, result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Summer is unavailable.");
      }
    });
  }

  function bookOption(option: SummerBookingOption) {
    if (!customerId && !visitorEmail.trim()) {
      setError(
        "Add the guest email (or select a CRM customer) before confirming a booking.",
      );
      return;
    }
    startTransition(async () => {
      setError(null);
      // Ensure we have a customer — confirm action requires customerId
      let cid = customerId;
      if (!cid) {
        const turn = await sendSummerMessage({
          message: "Look up my account",
          conversationId,
          visitorName: visitorName || null,
          visitorEmail: visitorEmail || null,
          visitorPhone: visitorPhone || null,
        });
        if (turn.conversationId) setConversationId(turn.conversationId);
        // Lookup alone may recognize but not return id to client — use CRM link flow
        // For staff workspace: create/find via email by confirming with a resolved id from a second lookup action
        const { summerRecognizeCustomerAction } = await import(
          "@/lib/actions/summer"
        );
        const snap = await summerRecognizeCustomerAction({
          email: visitorEmail,
          phone: visitorPhone,
        });
        if (!snap?.customerId) {
          setError(
            "Guest not found in CRM. Open CRM to add them, then paste their customer id or use their email after creating the profile.",
          );
          setMessages((prev) => [
            ...prev,
            {
              id: nextId("a"),
              role: "assistant",
              content:
                "I need a CRM customer before I can confirm. Add the guest in CRM (or enter an existing email), then select the opening again.",
              escalated: true,
            },
          ]);
          return;
        }
        cid = snap.customerId;
        setCustomerId(cid);
        setRecognizedName(snap.displayName);
      }

      if (rescheduleTargetId) {
        const result = await rescheduleSummerAppointmentAction({
          appointmentId: rescheduleTargetId,
          option,
          customerId: cid,
        });
        setRescheduleTargetId(null);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("a"),
            role: "assistant",
            content: result.reply,
            confirmation: result.ok ? result.reply : null,
            conflicts: result.conflicts,
            escalated: !result.ok,
          },
        ]);
        return;
      }

      const result = await confirmSummerBookingAction({
        option,
        customerId: cid!,
        conversationId,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("a"),
          role: "assistant",
          content: result.reply,
          confirmation: result.ok ? result.reply : null,
          conflicts: result.conflicts,
          escalated: !result.ok,
        },
      ]);
    });
  }

  function cancelAppointment(card: SummerAppointmentCard) {
    startTransition(async () => {
      const result = await cancelSummerAppointmentAction({
        appointmentId: card.id,
        customerId,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("a"),
          role: "assistant",
          content: result.reply,
          confirmation: result.ok ? result.reply : null,
          escalated: !result.ok,
        },
      ]);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      {knowledgeIncomplete ? (
        <div
          className="col-span-full flex flex-wrap items-start gap-3 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
          role="status"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">
              Summer needs more business data before answering confidently
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Missing: {knowledgeGaps.join(", ")}. Summer will say when something
              is not on file — she never invents hours, prices, or availability.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {knowledgeReady.serviceCount === 0 ? (
                <Link
                  href="/dashboard/services"
                  className="text-xs font-medium underline underline-offset-2"
                >
                  Add services
                </Link>
              ) : null}
              {knowledgeReady.employeeCount === 0 ? (
                <Link
                  href="/dashboard/employees"
                  className="text-xs font-medium underline underline-offset-2"
                >
                  Add employees
                </Link>
              ) : null}
              {knowledgeReady.hoursConfigured === 0 ? (
                <Link
                  href="/dashboard/business"
                  className="text-xs font-medium underline underline-offset-2"
                >
                  Set hours
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <Card className="overflow-hidden border-border/80">
        <CardHeader className="border-b border-border/80 bg-gradient-to-br from-spark/10 via-background to-background">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-spark/15 text-spark">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg">Summer</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                AI Receptionist · Booking Engine · Availability Engine · CRM
              </p>
              {recognizedName ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs">
                  <UserRound className="size-3.5" aria-hidden />
                  Recognized: {recognizedName}
                </p>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="Guest name"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              aria-label="Guest name"
            />
            <Input
              placeholder="Guest email (CRM lookup)"
              type="email"
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
              aria-label="Guest email"
            />
            <Input
              placeholder="Guest phone"
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              aria-label="Guest phone"
            />
          </div>

          <div
            className="flex max-h-[min(52vh,520px)] min-h-[280px] flex-col gap-3 overflow-y-auto rounded-[var(--radius-md)] border border-border/70 bg-muted/15 p-3"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                <div
                  className={cn(
                    "max-w-[92%] rounded-[var(--radius-md)] px-3 py-2 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : m.escalated
                        ? "border border-amber-500/30 bg-amber-500/10"
                        : "border border-border bg-background",
                  )}
                >
                  {m.content}
                </div>

                {m.escalated ? (
                  <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    Escalation active — staff follow-up may be queued in CRM.
                  </div>
                ) : null}

                {m.conflicts && m.conflicts.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {m.conflicts.map((c, i) => (
                      <li
                        key={`${c.message}-${i}`}
                        className="rounded-md border border-border/80 bg-background px-2 py-1.5"
                      >
                        <span className="font-medium text-foreground">
                          Conflict
                          {c.code ? ` · ${c.code}` : ""}:
                        </span>{" "}
                        {c.message}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {m.confirmation ? (
                  <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-sm">
                    <CalendarCheck2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {m.confirmation}
                  </div>
                ) : null}

                {m.bookingOptions && m.bookingOptions.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {m.bookingOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={pending}
                        onClick={() => bookOption(opt)}
                        className="rounded-[var(--radius-md)] border border-border bg-background p-3 text-left transition hover:border-spark/40 hover:bg-spark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                      >
                        <p className="text-sm font-medium">{opt.serviceName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {opt.dateLabel} · {opt.timeLabel}
                        </p>
                        <p className="mt-1 text-xs">
                          {opt.staffName}
                          {opt.price != null
                            ? ` · $${Number(opt.price).toFixed(0)}`
                            : ""}
                        </p>
                        <p className="mt-2 text-[11px] font-medium text-spark">
                          {rescheduleTargetId
                            ? "Confirm reschedule"
                            : "Confirm booking"}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : null}

                {m.appointmentCards && m.appointmentCards.length > 0 ? (
                  <div className="space-y-2">
                    {m.appointmentCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3 py-2"
                      >
                        <div className="min-w-0 text-sm">
                          <p className="font-medium">{card.serviceName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(card.startIso), "MMM d, yyyy")} at{" "}
                            {formatTime(parseISO(card.startIso))}
                            {card.staffName ? ` · ${card.staffName}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={pending}
                            onClick={() => {
                              setRescheduleTargetId(card.id);
                              send(
                                `Reschedule my ${card.serviceName} appointment`,
                              );
                            }}
                          >
                            Reschedule
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-destructive"
                            disabled={pending}
                            onClick={() => cancelAppointment(card)}
                          >
                            <CalendarX2 className="size-3.5" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {pending ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Summer is working…
              </p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-spark/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Summer to book, reschedule, cancel, or answer business questions…"
              rows={2}
              className="min-h-[44px] resize-none"
              aria-label="Message Summer"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button
              type="submit"
              disabled={pending || !input.trim()}
              className="shrink-0 self-end"
              aria-label="Send message"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Grounded knowledge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{knowledgeReady.serviceCount} services</p>
            <p>{knowledgeReady.employeeCount} employees</p>
            <p>{knowledgeReady.hoursConfigured} days with hours</p>
            {knowledgeIncomplete ? (
              <p className="pt-1 text-xs text-amber-800 dark:text-amber-200">
                Incomplete setup — Summer will refuse to guess missing facts.
              </p>
            ) : (
              <p className="pt-1 text-xs">
                Answers and prices come from Business, Services, and Employees —
                never invented.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Guardrails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <p>• Booking Engine only for writes</p>
            <p>• Availability Engine only for slots</p>
            <p>• CRM read for preferences & history</p>
            <p>• Escalate on no availability / human request</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Staff tools</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/dashboard/clients"
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open CRM
            </Link>
            <Link
              href="/dashboard/calendar"
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open calendar
            </Link>
            <Link
              href="/dashboard/business"
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Summer settings
            </Link>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
