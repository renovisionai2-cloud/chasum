"use client";

import { AiEmployeeAvatar } from "@/components/ai-workforce/employee-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import {
  getAlexAvailabilityRecommendations,
  type AlexSlotRecommendation,
} from "@/lib/ai-workforce/alex";
import { sendSummerMessage } from "@/lib/actions/summer";
import { AI_EMPLOYEES } from "@/lib/ai-workforce/roster";
import type { AiEmployee } from "@/lib/ai-workforce/types";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  employee?: AiEmployee;
  content: string;
};

const STARTERS = [
  "What are our business hours?",
  "What open slots does Alex see this week?",
  "Summer, help me start a booking",
  "Summarize what each AI employee is responsible for.",
];

function formatAlexSlots(recs: AlexSlotRecommendation[]): string {
  return recs
    .map((r) => {
      const times = r.slots
        .map((iso) => formatTime(parseISO(iso)))
        .join(", ");
      return `• ${r.date} — ${r.serviceName} with ${r.staffName}: ${times}`;
    })
    .join("\n");
}

function staticReply(prompt: string): ChatMessage {
  const lower = prompt.toLowerCase();
  let employee = AI_EMPLOYEES.find((e) => e.id === "leo")!;
  let content =
    "I can route you to the right AI employee and explain responsibilities. For real openings, ask Alex about available slots — recommendations come only from the scheduling engine.";

  if (lower.includes("friday") || lower.includes("fill") || lower.includes("quiet")) {
    employee = AI_EMPLOYEES.find((e) => e.id === "maya")!;
    content =
      "Maya (Marketing) and Alex (Scheduler) collaborate here: Alex only proposes real openings from your calendar engine; Maya drafts outreach for your approval. Nothing sends without you.";
  } else if (lower.includes("responsib") || lower.includes("each") || lower.includes("team")) {
    employee = AI_EMPLOYEES.find((e) => e.id === "chase")!;
    content =
      "Summer greets and books, Alex schedules, Maya markets (with approval), Leo advises, Sophia cares for clients after booking, and Chase monitors operations. Each has one clear job.";
  }

  return {
    id: "pending",
    role: "assistant",
    employee,
    content,
  };
}

function wantsAlexAvailability(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (wantsSummerReception(lower)) return false;
  return (
    lower.includes("alex") ||
    lower.includes("slot") ||
    lower.includes("schedul") ||
    lower.includes("availab") ||
    lower.includes("opening") ||
    lower.includes("open time")
  );
}

function wantsSummerReception(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    lower.includes("summer") ||
    lower.includes("emma") ||
    lower.includes("hours") ||
    lower.includes("receptionist") ||
    lower.includes("book") ||
    lower.includes("service") ||
    lower.includes("escalate") ||
    lower.includes("speak to staff") ||
    lower.includes("location") ||
    lower.includes("cancel") ||
    lower.includes("reschedule")
  );
}

export function AiCommandCenter() {
  const [input, setInput] = useState("");
  const idRef = useRef(0);
  const [pending, startTransition] = useTransition();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      employee: AI_EMPLOYEES.find((e) => e.id === "chase"),
      content:
        "Welcome to the Command Center. Ask about operations — when you ask Alex for openings, answers come only from get_available_slots. Open Chase for the full operations workspace.",
    },
  ]);

  function nextId(prefix: string) {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const userMessage: ChatMessage = {
      id: nextId("u"),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    startTransition(async () => {
      const alex = AI_EMPLOYEES.find((e) => e.id === "alex")!;
      const summer = AI_EMPLOYEES.find((e) => e.id === "summer")!;
      let reply: ChatMessage;

      if (wantsSummerReception(trimmed)) {
        try {
          const result = await sendSummerMessage({ message: trimmed });
          let content = result.reply;
          if (result.bookingOptions.length > 0) {
            content += `\n\n${result.bookingOptions.length} live openings ready — open Summer’s reception workspace to confirm.`;
          }
          if (result.escalated) {
            content += "\n\nEscalated for staff follow-up.";
          }
          reply = {
            id: nextId("a"),
            role: "assistant",
            employee: summer,
            content,
          };
        } catch {
          reply = {
            id: nextId("a"),
            role: "assistant",
            employee: summer,
            content:
              "Summer could not load business knowledge right now. No answers were invented — try again from Summer’s reception workspace.",
          };
        }
      } else if (wantsAlexAvailability(trimmed)) {
        try {
          const result = await getAlexAvailabilityRecommendations({
            daysAhead: 5,
          });
          const body =
            result.recommendations.length > 0
              ? `${result.message}\n\n${formatAlexSlots(result.recommendations)}\n\nThese times come from the scheduling engine only — nothing was invented.`
              : result.message;
          reply = {
            id: nextId("a"),
            role: "assistant",
            employee: alex,
            content: body,
          };
        } catch {
          reply = {
            id: nextId("a"),
            role: "assistant",
            employee: alex,
            content:
              "Alex could not reach the scheduling engine right now. No times were invented — try again from the calendar when the connection is back.",
          };
        }
      } else {
        reply = staticReply(trimmed);
        reply.id = nextId("a");
      }

      setMessages((prev) => [...prev, reply]);
    });
  }

  return (
    <div className="ds-page">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/ai-workforce" className="mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            aria-label="Back to AI Workforce"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Command Center"
          description="Talk to your AI Workforce. Summer uses grounded business data and the Booking Engine; Alex uses real availability only."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Team</CardTitle>
            <CardDescription>Route by responsibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {AI_EMPLOYEES.filter((e) => e.id !== "emma" && e.id !== "noah").map(
              (employee) => (
              <Link
                key={employee.id}
                href={
                  employee.id === "chase"
                    ? "/dashboard/workforce/chase"
                    : `/dashboard/ai-workforce/${employee.slug}`
                }
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/50 ds-focus-ring"
              >
                <AiEmployeeAvatar employee={employee} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {employee.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {employee.shortRole}
                  </span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="flex min-h-[32rem] flex-col lg:col-span-3">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-spark-muted text-spark">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle className="text-base">Conversation</CardTitle>
                <CardDescription>
                  Summer · receptionist · Alex · live slots
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "justify-end",
                  )}
                >
                  {message.role === "assistant" && message.employee && (
                    <AiEmployeeAvatar employee={message.employee} size="sm" />
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-[var(--radius-md)] px-4 py-3 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/40 text-foreground",
                    )}
                  >
                    {message.role === "assistant" && message.employee && (
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {message.employee.name}
                      </p>
                    )}
                    {message.content}
                  </div>
                </div>
              ))}
              {pending && (
                <p className="text-xs text-muted-foreground">
                  Working with Chasum data…
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => send(starter)}
                  disabled={pending}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground disabled:opacity-50"
                >
                  {starter}
                </button>
              ))}
            </div>

            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI Workforce…"
                rows={2}
                className="min-h-[2.75rem] flex-1 resize-none"
                aria-label="Message the AI Workforce"
                disabled={pending}
              />
              <Button type="submit" className="sm:h-11" disabled={pending}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
