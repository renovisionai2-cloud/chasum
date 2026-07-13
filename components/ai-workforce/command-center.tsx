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
import { AI_EMPLOYEES } from "@/lib/ai-workforce/roster";
import type { AiEmployee } from "@/lib/ai-workforce/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  employee?: AiEmployee;
  content: string;
};

const STARTERS = [
  "Who on my AI team can help fill a quiet Friday?",
  "Summarize what each AI employee is responsible for.",
  "What will Alex do before inventing any available slots?",
];

function placeholderReply(prompt: string): ChatMessage {
  const lower = prompt.toLowerCase();
  let employee = AI_EMPLOYEES.find((e) => e.id === "leo")!;
  let content =
    "I'm in preview mode — live reasoning comes later. I can already route you to the right AI employee and explain their responsibilities. I will never invent appointment times, prices, or client records.";

  if (lower.includes("friday") || lower.includes("fill") || lower.includes("quiet")) {
    employee = AI_EMPLOYEES.find((e) => e.id === "maya")!;
    content =
      "Maya (Marketing) and Alex (Scheduler) would collaborate here: Alex only proposes real openings from your calendar engine; Maya drafts outreach for your approval. Nothing sends without you.";
  } else if (lower.includes("alex") || lower.includes("slot") || lower.includes("schedul")) {
    employee = AI_EMPLOYEES.find((e) => e.id === "alex")!;
    content =
      "Alex only uses Chasum’s availability engine. If a slot is not returned by get_available_slots, Alex will not offer it — AI never invents openings.";
  } else if (lower.includes("responsib") || lower.includes("each") || lower.includes("team")) {
    employee = AI_EMPLOYEES.find((e) => e.id === "noah")!;
    content =
      "Emma greets, Alex schedules, Maya markets (with approval), Leo advises, Sophia cares for clients after booking, and Noah coordinates operations. Each has one clear job.";
  }

  return {
    id: "pending",
    role: "assistant",
    employee,
    content,
  };
}

export function AiCommandCenter() {
  const [input, setInput] = useState("");
  const idRef = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      employee: AI_EMPLOYEES.find((e) => e.id === "noah"),
      content:
        "Welcome to the Command Center. Ask your AI Workforce anything about operations — answers are preview placeholders until live intelligence is connected. Your business data stays the source of truth.",
    },
  ]);

  function nextId(prefix: string) {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: nextId("u"),
      role: "user",
      content: trimmed,
    };
    const reply = placeholderReply(trimmed);
    reply.id = nextId("a");
    setMessages((prev) => [...prev, userMessage, reply]);
    setInput("");
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
          description="Talk to your AI Workforce. Preview intelligence only — architecture first."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Team</CardTitle>
            <CardDescription>Route by responsibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {AI_EMPLOYEES.map((employee) => (
              <Link
                key={employee.id}
                href={`/dashboard/ai-workforce/${employee.slug}`}
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
                <CardDescription>Enterprise-ready shell · preview replies</CardDescription>
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
                      "max-w-[85%] rounded-[var(--radius-md)] px-4 py-3 text-sm",
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
            </div>

            <div className="flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => send(starter)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
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
              />
              <Button type="submit" className="sm:h-11">
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
