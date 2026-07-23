"use client";

import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { MEET_SUMMER_PROMPTS } from "@/lib/marketing/meet-summer";
import { cn } from "@/lib/utils";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

/**
 * Inline Summer panel for Meet Summer — same Knowledge Engine as the floating concierge.
 */
export function SummerEmbeddedPanel({ className }: { className?: string }) {
  const {
    hydrated,
    messages,
    suggestions,
    pending,
    error,
    send,
    reducedMotion,
  } = useConciergeConversation();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  useEffect(() => {
    if (hydrated) inputRef.current?.focus();
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div
        className={cn(
          "flex min-h-[28rem] items-center justify-center rounded-2xl border border-border/70 bg-card/60",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">Summer is joining…</p>
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = draft;
    setDraft("");
    void send(value);
  }

  const chips =
    suggestions.length > 0 ? suggestions.slice(0, 4) : [...MEET_SUMMER_PROMPTS];

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/95 shadow-[0_24px_64px_-28px_rgba(37,99,235,0.4)]",
        className,
      )}
      aria-label="Talk with Summer"
    >
      <header className="flex items-center gap-3 border-b border-border/70 bg-gradient-to-r from-primary/10 via-background to-spark/10 px-4 py-3.5 sm:px-5">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Summer</p>
          <p className="text-xs text-muted-foreground">
            AI Business Assistant · ask anything about Chasum
          </p>
        </div>
      </header>

      <div
        ref={listRef}
        className="flex max-h-[min(48vh,22rem)] min-h-[16rem] flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.role === "assistant"
                ? "self-start border border-border/60 bg-card text-foreground"
                : "self-end bg-primary text-primary-foreground",
              !reducedMotion &&
                "transition-[opacity,transform] duration-300 ease-out",
            )}
          >
            {m.content}
          </div>
        ))}
        {pending ? (
          <div className="self-start rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
            <span className="inline-flex gap-1">
              <span className="size-1.5 animate-pulse rounded-full bg-primary/70" />
              <span className="size-1.5 animate-pulse rounded-full bg-primary/70 [animation-delay:120ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-primary/70 [animation-delay:240ms]" />
            </span>
          </div>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      {!pending ? (
        <div className="flex flex-wrap gap-2 border-t border-border/50 px-4 py-3 sm:px-5">
          {chips.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-border/70 p-3 sm:p-4"
      >
        <label className="sr-only" htmlFor="meet-summer-input">
          Message Summer
        </label>
        <input
          id="meet-summer-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Summer a question…"
          disabled={pending}
          className="min-w-0 flex-1 rounded-xl border border-border/80 bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          className="inline-flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-105 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="size-4" />
        </button>
      </form>
    </section>
  );
}
