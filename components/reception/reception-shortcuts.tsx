"use client";

import {
  dispatchOpenCommandPalette,
  dispatchReceptionAction,
} from "@/lib/reception/workflow-events";
import { useEffect } from "react";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[role='dialog'], [role='combobox'], [role='listbox']"));
}

/** Reception desk shortcuts — ignored while typing in forms. */
export function ReceptionShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();
      if (key === "/" || key === "f") {
        e.preventDefault();
        dispatchReceptionAction("focus-customer-search");
        return;
      }
      if (key === "n") {
        e.preventDefault();
        dispatchReceptionAction("new-customer");
        return;
      }
      if (key === "b") {
        e.preventDefault();
        dispatchReceptionAction("book-appointment");
        return;
      }
      if (key === "w") {
        e.preventDefault();
        dispatchReceptionAction("walk-in");
        return;
      }
      if (key === "t") {
        e.preventDefault();
        dispatchReceptionAction("block-time");
        return;
      }
      if (key === "i") {
        e.preventDefault();
        dispatchReceptionAction("add-note");
        return;
      }
      if (key === "?") {
        e.preventDefault();
        dispatchOpenCommandPalette();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
