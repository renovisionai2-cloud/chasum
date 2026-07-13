"use client";

import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useCallback, useSyncExternalStore } from "react";

const KEY_PREFIX = "chasum-reception-notes:";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("chasum-notes-changed", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("chasum-notes-changed", onStoreChange);
  };
}

function getSnapshot(dayKey: string) {
  try {
    return localStorage.getItem(dayKey) ?? "";
  } catch {
    return "";
  }
}

export function TodayNotes() {
  const dayKey = `${KEY_PREFIX}${format(new Date(), "yyyy-MM-dd")}`;
  const notes = useSyncExternalStore(
    subscribe,
    () => getSnapshot(dayKey),
    () => "",
  );

  const handleChange = useCallback(
    (value: string) => {
      try {
        localStorage.setItem(dayKey, value);
      } catch {
        /* ignore quota */
      }
      window.dispatchEvent(new Event("chasum-notes-changed"));
    },
    [dayKey],
  );

  return (
    <section className="space-y-2">
      <h3 className="ds-section-title text-sm">Today&apos;s notes</h3>
      <Textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Front-desk notes for today (saved on this device)…"
        rows={3}
        className="min-h-[4.5rem] resize-none text-sm"
        aria-label="Today's notes"
      />
    </section>
  );
}
