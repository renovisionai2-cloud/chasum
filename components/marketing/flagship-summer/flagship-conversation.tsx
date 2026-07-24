"use client";

import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

/**
 * Evolving consultation transcript — one living understanding, not a form log.
 */
export function FlagshipConversation({
  className,
  onChangeCategory,
}: {
  className?: string;
  onChangeCategory?: () => void;
}) {
  const {
    hydrated,
    messages,
    suggestions,
    pending,
    error,
    continueUnderstanding,
    reducedMotion,
  } = useConciergeConversation();
  const [draft, setDraft] = useState("");
  const [fadeKey, setFadeKey] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const understanding = useMemo(() => {
    // Skip page greeting; show the latest Summer reply as the living understanding
    const assistants = messages.filter((m) => m.role === "assistant");
    return assistants.length > 1
      ? assistants[assistants.length - 1]
      : assistants[0] ?? null;
  }, [messages]);

  const lastUser = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "user") return messages[i];
    }
    return null;
  }, [messages]);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [understanding?.id]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [understanding?.id, pending, lastUser?.id]);

  if (!hydrated) {
    return (
      <div className={cn("fs-chat", className)} aria-busy="true">
        <p className="fs-chat-preparing">Preparing Summer…</p>
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = draft;
    setDraft("");
    void continueUnderstanding(value);
  }

  return (
    <section
      className={cn("fs-chat", className)}
      aria-label="Continue with Summer"
    >
      {onChangeCategory ? (
        <button
          type="button"
          className="fs-change-path"
          onClick={onChangeCategory}
        >
          ← Change Business Category
        </button>
      ) : null}

      <div ref={listRef} className="fs-chat-log">
        {lastUser ? (
          <div
            className={cn(
              "fs-chat-bubble fs-chat-user",
              !reducedMotion && "fs-fade-in",
            )}
          >
            {lastUser.content}
          </div>
        ) : null}

        {understanding && !pending ? (
          <div
            key={fadeKey}
            className={cn(
              "fs-chat-bubble fs-chat-assistant fs-chat-understanding",
              !reducedMotion && "fs-fade-in",
            )}
          >
            {understanding.content}
          </div>
        ) : null}

        {pending ? (
          <p className="fs-chat-waiting" aria-live="polite">
            Summer is updating her understanding…
          </p>
        ) : null}

        {error ? <p className="fs-chat-error">{error}</p> : null}
      </div>

      {!pending && suggestions.length > 0 ? (
        <div className="fs-chat-chips">
          {suggestions.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void continueUnderstanding(s)}
            >
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
