"use client";

import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

/**
 * Calm follow-up conversation after card discovery — not a support widget.
 */
export function FlagshipConversation({ className }: { className?: string }) {
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

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  if (!hydrated) {
    return (
      <div className={cn("fs-chat", className)} aria-busy="true">
        <p className="text-sm text-white/45">Preparing Summer…</p>
      </div>
    );
  }

  // Skip the greeting in the transcript display if we already showed awakening
  const visible = messages.filter(
    (m, i) => !(i === 0 && m.role === "assistant"),
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = draft;
    setDraft("");
    void send(value);
  }

  return (
    <section className={cn("fs-chat", className)} aria-label="Continue with Summer">
      <div ref={listRef} className="fs-chat-log">
        {visible.map((m) => (
          <div
            key={m.id}
            className={cn(
              "fs-chat-bubble",
              m.role === "assistant" ? "fs-chat-assistant" : "fs-chat-user",
              !reducedMotion && "fs-fade-in",
            )}
          >
            {m.content}
          </div>
        ))}
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
      </div>

      {!pending && suggestions.length > 0 ? (
        <div className="fs-chat-chips">
          {suggestions.slice(0, 4).map((s) => (
            <button key={s} type="button" onClick={() => void send(s)}>
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="fs-chat-form">
        <label className="sr-only" htmlFor="fs-chat-input">
          Continue with Summer
        </label>
        <input
          id="fs-chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={pending}
          placeholder="Tell Summer more…"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          aria-label="Send"
        >
          <Send className="size-4" />
        </button>
      </form>
    </section>
  );
}
