"use client";

import {
  createEmptySessionMemory,
  createId,
  getPageGreeting,
  loadSessionMemory,
  recordPageVisit,
  runConciergeTurn,
  saveSessionMemory,
  type ConciergeMessage,
  type SessionMemory,
} from "@/lib/website-concierge";
import { detectMarketingPage } from "@/lib/website-concierge/page-awareness";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useSyncExternalStore } from "react";

const OPEN_KEY = "chasum.website-concierge.open.v1";
const MESSAGES_KEY = "chasum.website-concierge.messages.v1";

type ConciergeStore = {
  memory: SessionMemory;
  messages: ConciergeMessage[];
  open: boolean;
  suggestions: string[];
  pending: boolean;
  error: string | null;
  booted: boolean;
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function loadMessages(): ConciergeMessage[] {
  try {
    const raw = window.sessionStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConciergeMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ConciergeMessage[]) {
  try {
    window.sessionStorage.setItem(
      MESSAGES_KEY,
      JSON.stringify(messages.slice(-40)),
    );
  } catch {
    /* ignore */
  }
}

function readOpen(): boolean {
  try {
    return window.sessionStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeOpen(open: boolean) {
  try {
    window.sessionStorage.setItem(OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function defaultSuggestions(pageId: string): string[] {
  if (pageId === "meet-summer") {
    return [
      "I run an ultrasound clinic",
      "We have 4 employees",
      "We use Picktime",
      "Reporting is our biggest challenge",
    ];
  }
  if (pageId === "home") {
    return ["I run a salon", "What is Chasum?", "Show me pricing"];
  }
  if (pageId === "pricing") {
    return ["Which plan fits me?", "Private Alpha?", "Book a walkthrough"];
  }
  return ["What is Chasum?", "Pricing", "Private Alpha"];
}

function createBootedStore(pathname: string): ConciergeStore {
  const page = detectMarketingPage(pathname);
  const memory = recordPageVisit(loadSessionMemory(), page.pageId);
  saveSessionMemory(memory);
  const storedMessages = loadMessages();
  const messages =
    storedMessages.length > 0
      ? storedMessages
      : [
          {
            id: createId(),
            role: "assistant" as const,
            content: getPageGreeting(page.pageId),
            createdAt: new Date().toISOString(),
          },
        ];
  if (storedMessages.length === 0) saveMessages(messages);
  return {
    memory,
    messages,
    open: readOpen(),
    suggestions: defaultSuggestions(page.pageId),
    pending: false,
    error: null,
    booted: true,
  };
}

let store: ConciergeStore = {
  memory: createEmptySessionMemory(),
  messages: [],
  open: false,
  suggestions: [],
  pending: false,
  error: null,
  booted: false,
};

function getServerSnapshot(): ConciergeStore {
  return {
    memory: createEmptySessionMemory(),
    messages: [],
    open: false,
    suggestions: [],
    pending: false,
    error: null,
    booted: false,
  };
}

function getSnapshot(): ConciergeStore {
  return store;
}

function subscribe(listener: () => void) {
  if (typeof window !== "undefined" && !store.booted) {
    store = createBootedStore(window.location.pathname || "/");
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setStore(patch: Partial<ConciergeStore>) {
  store = { ...store, ...patch };
  emit();
}

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useConciergeConversation() {
  const pathname = usePathname() || "/";
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );
  const page = detectMarketingPage(pathname);

  useEffect(() => {
    if (!state.booted) return;
    startTransition(() => {
      const memory = recordPageVisit(store.memory, page.pageId);
      saveSessionMemory(memory);
      setStore({
        memory,
        suggestions: defaultSuggestions(page.pageId),
      });
    });
  }, [page.pageId, state.booted]);

  return {
    open: state.open,
    setOpen(next: boolean) {
      writeOpen(next);
      setStore({ open: next });
    },
    hydrated: state.booted,
    page,
    memory: state.memory,
    messages: state.messages,
    suggestions: state.suggestions,
    pending: state.pending,
    error: state.error,
    /**
     * Presentation helper (Meet Summer): clear discovery transcript/profile so
     * Summer can start a fresh path without contradictory messages.
     * Does not change Discovery Engine code — only session presentation state.
     */
    resetDiscoveryPath() {
      const pageId = detectMarketingPage(pathname).pageId;
      const memory = recordPageVisit(createEmptySessionMemory(), pageId);
      const greeting: ConciergeMessage = {
        id: createId(),
        role: "assistant",
        content: getPageGreeting(pageId),
        createdAt: new Date().toISOString(),
      };
      saveSessionMemory(memory);
      saveMessages([greeting]);
      setStore({
        memory,
        messages: [greeting],
        suggestions: defaultSuggestions(pageId),
        pending: false,
        error: null,
      });
    },
    /**
     * Replace prior discovery turns with a single new understanding.
     * Removes obsolete user/assistant pairs before sending the new path prompt.
     */
    async refineUnderstanding(text: string) {
      const content = text.trim();
      if (!content || store.pending) return;

      const pageId = detectMarketingPage(pathname).pageId;
      const memory = recordPageVisit(createEmptySessionMemory(), pageId);
      const greeting: ConciergeMessage = {
        id: createId(),
        role: "assistant",
        content: getPageGreeting(pageId),
        createdAt: new Date().toISOString(),
      };
      const userMessage: ConciergeMessage = {
        id: createId(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      const transcript = [greeting, userMessage];
      saveSessionMemory(memory);
      saveMessages(transcript);
      setStore({
        memory,
        messages: transcript,
        pending: true,
        error: null,
        suggestions: [],
      });

      try {
        const result = await runConciergeTurn({
          pathname,
          userMessage: content,
          messages: transcript,
          memory,
        });
        // Single evolving understanding: greeting + this answer + new Summer reply
        const nextMessages = [greeting, userMessage, result.assistantMessage];
        saveMessages(nextMessages);
        saveSessionMemory(result.memory);
        setStore({
          messages: nextMessages,
          memory: result.memory,
          suggestions: result.suggestions,
          pending: false,
        });
      } catch {
        setStore({
          pending: false,
          error: "Something went wrong. Please try again.",
        });
      }
    },
    /**
     * Meet Summer: continue consultation while replacing the prior reply.
     * Session Memory keeps facts; transcript shows one evolving understanding.
     */
    async continueUnderstanding(text: string) {
      const content = text.trim();
      if (!content || store.pending) return;

      const userMessage: ConciergeMessage = {
        id: createId(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      const greeting =
        store.messages[0]?.role === "assistant" ? store.messages[0] : null;
      const engineTranscript = [...store.messages, userMessage].slice(-12);
      const waiting = greeting
        ? [greeting, userMessage]
        : [userMessage];
      saveMessages(waiting);
      setStore({
        messages: waiting,
        pending: true,
        error: null,
      });

      try {
        const result = await runConciergeTurn({
          pathname,
          userMessage: content,
          messages: engineTranscript,
          memory: store.memory,
        });
        const nextMessages = greeting
          ? [greeting, userMessage, result.assistantMessage]
          : [userMessage, result.assistantMessage];
        saveMessages(nextMessages);
        saveSessionMemory(result.memory);
        setStore({
          messages: nextMessages,
          memory: result.memory,
          suggestions: result.suggestions,
          pending: false,
        });
      } catch {
        setStore({
          pending: false,
          error: "Something went wrong. Please try again.",
        });
      }
    },
    async send(text: string) {
      const content = text.trim();
      if (!content || store.pending) return;

      const userMessage: ConciergeMessage = {
        id: createId(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      const transcript = [...store.messages, userMessage];
      saveMessages(transcript);
      setStore({
        messages: transcript,
        pending: true,
        error: null,
      });

      try {
        const result = await runConciergeTurn({
          pathname,
          userMessage: content,
          messages: transcript,
          memory: store.memory,
        });
        const nextMessages = [...transcript, result.assistantMessage];
        saveMessages(nextMessages);
        saveSessionMemory(result.memory);
        setStore({
          messages: nextMessages,
          memory: result.memory,
          suggestions: result.suggestions,
          pending: false,
        });
      } catch {
        setStore({
          pending: false,
          error: "Something went wrong. Please try again.",
        });
      }
    },
    reducedMotion,
  };
}
