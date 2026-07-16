"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getReceptionistMessages,
  listReceptionistConversations,
  sendReceptionistMessage,
} from "@/lib/actions/ai-receptionist";
import type {
  ReceptionistConversation,
} from "@/lib/ai-receptionist/types";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

type ChatLine = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTERS = [
  "What are your hours?",
  "What services do you offer?",
  "Who is on the team?",
  "When is the next available appointment?",
  "I'd like to book",
  "I need to speak with staff",
];

export function EmmaReceptionistPanel({
  knowledge,
  initialConversations,
}: {
  knowledge: {
    businessName: string;
    serviceCount: number;
    employeeCount: number;
    locationCount: number;
    hoursConfigured: number;
    bookingUrl: string;
    providerReady: boolean;
    providerName: string;
  };
  initialConversations: ReceptionistConversation[];
}) {
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState<ChatLine[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi — I'm Emma, AI Receptionist for ${knowledge.businessName}. I answer from your Chasum data (hours, services, team, locations) and real availability only. Voice calling is reserved for a later phase.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function nextId(prefix: string) {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }

  function openConversation(id: string) {
    setConversationId(id);
    setError(null);
    startTransition(async () => {
      setLoadingHistory(true);
      try {
        const rows = await getReceptionistMessages(id);
        if (rows.length === 0) {
          setMessages([
            {
              id: "empty-history",
              role: "assistant",
              content: "No messages in this conversation yet.",
            },
          ]);
          return;
        }
        setMessages(
          rows
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load conversation.",
        );
      } finally {
        setLoadingHistory(false);
      }
    });
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: nextId("u"), role: "user", content: trimmed },
    ]);
    setInput("");

    startTransition(async () => {
      try {
        const result = await sendReceptionistMessage({
          message: trimmed,
          conversationId,
          visitorEmail: visitorEmail.trim() || null,
        });
        if (result.conversationId) {
          setConversationId(result.conversationId);
        }
        let content = result.reply;
        if (result.bookingUrl) {
          content += `\n\nStart booking: ${result.bookingUrl}`;
        }
        if (result.escalated) {
          content += result.followUpCreated
            ? "\n\nEscalated — a follow-up task was created in Communication Center."
            : "\n\nEscalated for staff follow-up.";
        }
        setMessages((prev) => [
          ...prev,
          { id: nextId("a"), role: "assistant", content },
        ]);
        const refreshed = await listReceptionistConversations();
        setConversations(refreshed);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Emma could not respond.",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Emma · live desk</CardTitle>
          <CardDescription>
            Provider: {knowledge.providerName}
            {knowledge.providerReady ? " · ready" : ""} · knowledge from{" "}
            {knowledge.serviceCount} services, {knowledge.employeeCount}{" "}
            employees, {knowledge.locationCount} locations,{" "}
            {knowledge.hoursConfigured} open days
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href={knowledge.bookingUrl} target="_blank">
            <Button size="sm" variant="outline">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Public booking
            </Button>
          </Link>
          <Link href="/dashboard/business">
            <Button size="sm" variant="ghost">
              Business data
            </Button>
          </Link>
          <Link href="/dashboard/clients">
            <Button size="sm" variant="ghost">
              CRM
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Conversations</CardTitle>
            <CardDescription>Stored per tenant</CardDescription>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <EmptyState
                variant="panel"
                title="No conversations yet"
                description="Start a practice chat. Apply migration 022 to persist history."
              />
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => openConversation(c.id)}
                      className={cn(
                        "w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-xs transition-colors",
                        conversationId === c.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="block truncate font-medium">
                        {c.intent ?? c.channel} · {c.status}
                      </span>
                      <span className="block truncate opacity-80">
                        {new Date(c.updated_at).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => {
                setConversationId(null);
                setMessages([
                  {
                    id: "welcome-new",
                    role: "assistant",
                    content: `New conversation ready for ${knowledge.businessName}.`,
                  },
                ]);
              }}
            >
              New conversation
            </Button>
          </CardContent>
        </Card>

        <Card className="flex min-h-[28rem] flex-col lg:col-span-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Practice console</CardTitle>
            <CardDescription>
              Optional visitor email links replies into CRM when the customer
              exists
            </CardDescription>
            <Input
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
              placeholder="visitor@email.com (optional CRM link)"
              type="email"
              className="mt-2"
            />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {loadingHistory ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading history…
                </p>
              ) : null}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] whitespace-pre-wrap rounded-[var(--radius-md)] px-3 py-2 text-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/40",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {pending ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Emma is checking business data…
                </p>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={pending}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:border-primary/35 hover:text-foreground disabled:opacity-50"
                >
                  {s}
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
                placeholder="Ask Emma about hours, services, availability…"
                rows={2}
                disabled={pending}
                className="min-h-[2.75rem] flex-1 resize-none"
                aria-label="Message Emma"
              />
              <Button type="submit" disabled={pending || !input.trim()}>
                <Send className="h-4 w-4" />
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
