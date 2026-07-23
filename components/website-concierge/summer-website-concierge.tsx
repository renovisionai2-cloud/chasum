"use client";

import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { cn } from "@/lib/utils";
import { MessageCircle, Minimize2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

/**
 * Floating Summer concierge — marketing layout only.
 * Responses come from lib/website-concierge, not hardcoded UI strings (except chrome).
 */
export function SummerWebsiteConcierge() {
  const {
    open,
    setOpen,
    hydrated,
    page,
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
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!hydrated) return null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = draft;
    setDraft("");
    void send(value);
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end p-4 sm:p-6"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <section
            className={cn(
              "flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/95 shadow-[0_24px_64px_-24px_rgba(37,99,235,0.45)] backdrop-blur-md",
              !reducedMotion &&
                "origin-bottom-right transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            )}
            aria-label="Summer AI website concierge"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border/70 bg-gradient-to-r from-primary/10 via-background to-spark/10 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Sparkles className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Summer
                    </p>
                    <p className="text-xs text-muted-foreground">
                      AI Business Assistant · {page.title}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Collapse Summer"
                >
                  <Minimize2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Close Summer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </header>

            <div
              ref={listRef}
              className="flex max-h-[min(52vh,26rem)] min-h-[14rem] flex-col gap-3 overflow-y-auto px-4 py-3"
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
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
            </div>

            {suggestions.length > 0 && !pending ? (
              <div className="flex flex-wrap gap-2 border-t border-border/50 px-4 py-2.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 border-t border-border/70 p-3"
            >
              <label className="sr-only" htmlFor="summer-concierge-input">
                Message Summer
              </label>
              <input
                id="summer-concierge-input"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about Chasum…"
                disabled={pending}
                className="min-w-0 flex-1 rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-105 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </form>
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-16px_rgba(37,99,235,0.85)] transition hover:brightness-105",
            !reducedMotion && "duration-300 ease-out hover:-translate-y-0.5",
          )}
          aria-expanded={open}
          aria-controls={undefined}
          aria-label={open ? "Hide Summer" : "Chat with Summer"}
        >
          <MessageCircle className="size-5" aria-hidden />
          <span className="hidden sm:inline">
            {open ? "Hide Summer" : "Ask Summer"}
          </span>
        </button>
      </div>
    </div>
  );
}
