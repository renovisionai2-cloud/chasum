"use client";

import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { presentConsultationReply } from "@/lib/marketing/flagship-consultation-voice";
import { buildBusinessProfileSummary } from "@/lib/marketing/meet-summer-intelligence";
import {
  consultationPauseMs,
  FS_UNDERSTANDING_COMPLETE,
  nextAcknowledgement,
} from "@/lib/marketing/summer-intelligence-pacing";
import { cn } from "@/lib/utils";
import { Check, Send } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

/**
 * Evolving consultation — continuous fades, brief acknowledgements, calm reveals.
 */
export function FlagshipConversation({
  className,
}: {
  className?: string;
}) {
  const {
    hydrated,
    messages,
    suggestions,
    pending,
    error,
    memory,
    continueUnderstanding,
    reducedMotion,
  } = useConciergeConversation();
  const [draft, setDraft] = useState("");
  const [stagedAck, setStagedAck] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const lastAckRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const understanding = useMemo(() => {
    const assistants = messages.filter((m) => m.role === "assistant");
    return assistants.length > 1
      ? assistants[assistants.length - 1]
      : assistants[0] ?? null;
  }, [messages]);

  const isComplete =
    memory.discoveryPhase === "recommending" ||
    memory.discoveryPhase === "open" ||
    memory.recommendationsMade.length > 0;

  const lastUser = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "user") return messages[i];
    }
    return null;
  }, [messages]);

  const industryLabel =
    memory.businessTypes.length > 0
      ? memory.businessTypes.join(" · ")
      : null;

  const profileSummary = useMemo(
    () =>
      buildBusinessProfileSummary(memory, {
        businessOverride: industryLabel,
      }),
    [memory, industryLabel],
  );

  const presented = useMemo(() => {
    if (!understanding) return null;
    if (isComplete) return FS_UNDERSTANDING_COMPLETE.message;
    return presentConsultationReply(understanding.content, {
      stripLeadingUnderstand: Boolean(lastUser),
    });
  }, [understanding, lastUser, isComplete]);

  const assistantId = understanding?.id ?? null;
  const instantReveal = reducedMotion || !lastUser;
  const showAck =
    !pending &&
    !!stagedAck &&
    stagedAck.id === assistantId &&
    !instantReveal &&
    revealedId !== assistantId;
  const showReply =
    !pending &&
    !!presented &&
    (instantReveal || revealedId === assistantId);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [understanding?.id, pending, lastUser?.id, showAck, showReply]);

  useEffect(() => {
    if (pending || !assistantId || !presented || instantReveal) return;
    if (revealedId === assistantId) return;

    let cancelled = false;
    const ack = nextAcknowledgement(lastAckRef.current);
    lastAckRef.current = ack;
    const pause = consultationPauseMs();

    const showTimer = window.setTimeout(() => {
      if (!cancelled) setStagedAck({ id: assistantId, text: ack });
    }, 20);

    const doneTimer = window.setTimeout(() => {
      if (cancelled) return;
      setStagedAck(null);
      setRevealedId(assistantId);
    }, 20 + pause);

    return () => {
      cancelled = true;
      window.clearTimeout(showTimer);
      window.clearTimeout(doneTimer);
    };
  }, [pending, assistantId, presented, instantReveal, revealedId]);

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
      className={cn(
        "fs-chat",
        pending && "fs-chat-processing",
        className,
      )}
      aria-label="Continue with Summer"
    >
      <div
        ref={listRef}
        className={cn("fs-chat-log", pending && "fs-chat-log-dim")}
      >
        {lastUser ? (
          <div
            className={cn(
              "fs-chat-bubble fs-chat-user",
              !reducedMotion && !pending && "fs-chat-fade-up",
              pending && "fs-chat-soft-out",
            )}
          >
            {lastUser.content}
          </div>
        ) : null}

        {showAck ? (
          <p
            className={cn("fs-chat-ack", !reducedMotion && "fs-chat-fade")}
            aria-live="polite"
          >
            {stagedAck?.text}
          </p>
        ) : null}

        {showReply ? (
          <div
            key={assistantId ?? "understanding"}
            className={cn(
              "fs-chat-bubble fs-chat-assistant fs-chat-understanding",
              !reducedMotion && "fs-chat-fade-up",
            )}
          >
            {isComplete ? (
              <div className="fs-profile-complete">
                <p className="fs-chat-complete-kicker">
                  {FS_UNDERSTANDING_COMPLETE.kicker}
                </p>
                {profileSummary.length > 0 ? (
                  <ul className="fs-profile-complete-list">
                    {profileSummary.map((field) => (
                      <li key={field.id} className="fs-profile-complete-row">
                        <Check
                          className="size-3.5 shrink-0 text-[color:var(--fs-blue)]"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        <span className="fs-profile-complete-label">
                          {field.label}
                        </span>
                        <span className="fs-profile-complete-value">
                          {field.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="fs-profile-complete-message">{presented}</p>
              </div>
            ) : (
              <div className="fs-chat-understanding-body whitespace-pre-line">
                {presented}
              </div>
            )}
          </div>
        ) : null}

        {pending ? (
          <div className="fs-chat-thinking" aria-live="polite">
            <span className="fs-chat-typing" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span className="fs-chat-waiting-copy">
              Summer is gathering her thoughts
              <span className="fs-chat-cursor" aria-hidden />
            </span>
          </div>
        ) : null}

        {error ? <p className="fs-chat-error">{error}</p> : null}
      </div>

      {!pending && showReply && suggestions.length > 0 && !isComplete ? (
        <div
          className={cn(
            "fs-chat-chips",
            !reducedMotion && "fs-chat-fade-up",
          )}
        >
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
          placeholder={
            isComplete
              ? "Ask Summer anything about configuring Chasum…"
              : "Tell me about your biggest challenge…"
          }
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
