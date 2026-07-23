"use client";

import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { MEET_SUMMER_PROMPTS } from "@/lib/marketing/meet-summer";
import { cn } from "@/lib/utils";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

/**
 * Premium AI conversation showcase for Meet Summer.
 * Same Knowledge Engine / Discovery stack as the floating concierge — presentation only.
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
  const [focused, setFocused] = useState(false);
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
          "meet-summer-glass flex min-h-[32rem] items-center justify-center",
          className,
        )}
        aria-busy="true"
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
        "meet-summer-glass relative flex flex-col overflow-hidden",
        focused && "meet-summer-glass-focus",
        className,
      )}
      aria-label="Talk with Summer"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 meet-summer-panel-glow"
        aria-hidden
      />

      <header className="flex items-center gap-4 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
        <span className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#1d4ed8] text-primary-foreground shadow-[0_12px_32px_-12px_rgba(37,99,235,0.85)]">
          <Sparkles className="size-5" aria-hidden />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#0b1324] bg-emerald-400",
              !reducedMotion && "marketing-live-dot",
            )}
            aria-hidden
          />
        </span>
        <div>
          <p className="text-base font-semibold tracking-tight text-white">
            Summer
          </p>
          <p className="text-xs text-white/55">
            AI Business Assistant · live · grounded answers
          </p>
        </div>
      </header>

      <div
        ref={listRef}
        className="flex max-h-[min(56vh,28rem)] min-h-[18rem] flex-col gap-3.5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6"
      >
        {messages.map((m, index) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[92%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
              m.role === "assistant"
                ? "self-start border border-white/10 bg-white/[0.06] text-white/92 backdrop-blur-sm"
                : "self-end bg-primary text-primary-foreground shadow-[0_12px_28px_-16px_rgba(37,99,235,0.9)]",
              !reducedMotion && "meet-summer-msg-enter",
            )}
            style={
              !reducedMotion
                ? { animationDelay: `${Math.min(index, 6) * 30}ms` }
                : undefined
            }
          >
            {m.content}
          </div>
        ))}
        {pending ? (
          <div
            className="meet-summer-thinking self-start rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Summer is thinking</span>
            <span className="inline-flex items-center gap-2 text-sm text-white/60">
              <span className="inline-flex gap-1.5" aria-hidden>
                <span className="meet-summer-think-dot" />
                <span className="meet-summer-think-dot [animation-delay:140ms]" />
                <span className="meet-summer-think-dot [animation-delay:280ms]" />
              </span>
              Thinking
            </span>
          </div>
        ) : null}
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
      </div>

      {!pending ? (
        <div className="flex flex-wrap gap-2 border-t border-white/8 px-5 py-3.5 sm:px-7">
          {chips.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              className="rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/75 transition hover:border-primary/45 hover:bg-primary/15 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2.5 border-t border-white/10 p-4 sm:p-5"
      >
        <label className="sr-only" htmlFor="meet-summer-input">
          Message Summer
        </label>
        <input
          id="meet-summer-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask Summer anything about Chasum…"
          disabled={pending}
          className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none ring-primary/40 placeholder:text-white/35 focus:border-primary/50 focus:ring-2"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_28px_-10px_rgba(37,99,235,0.85)] transition hover:brightness-110 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="size-4" />
        </button>
      </form>
    </section>
  );
}
