import type { ReactNode } from "react";

/** Highlight case-insensitive substrings matching `query` inside `text`. */
export function HighlightMatch({
  text,
  query,
}: {
  text: string;
  query: string;
}): ReactNode {
  const q = query.trim();
  if (!q || !text) return text;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={`${part}-${i}`}
        className="rounded-[2px] bg-accent px-0.5 font-medium text-foreground"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${i}`}>{part}</span>
    ),
  );
}
