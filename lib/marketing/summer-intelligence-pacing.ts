/**
 * Signature Experience Phase 2 — calm consultation pacing & voice.
 * Presentation helpers only; Discovery Engine remains the source of truth.
 */

export const FS_ACKNOWLEDGEMENTS = [
  "That makes sense.",
  "Great.",
  "Understood.",
  "Thanks.",
] as const;

export type FsAcknowledgement = (typeof FS_ACKNOWLEDGEMENTS)[number];

/** Natural pause between beats — 400–700ms, never long. */
export function consultationPauseMs(seed = Math.random()): number {
  return Math.round(400 + seed * 300);
}

/** Slightly longer think beat before a reply appears. */
export function consultationThinkMs(seed = Math.random()): number {
  return Math.round(480 + seed * 220);
}

/**
 * Pick an acknowledgement that is never the same as the previous one.
 */
export function nextAcknowledgement(
  previous: string | null | undefined,
  seed = Math.random(),
): FsAcknowledgement {
  const pool =
    previous && FS_ACKNOWLEDGEMENTS.includes(previous as FsAcknowledgement)
      ? FS_ACKNOWLEDGEMENTS.filter((a) => a !== previous)
      : [...FS_ACKNOWLEDGEMENTS];
  const index = Math.floor(seed * pool.length) % pool.length;
  return pool[index] ?? FS_ACKNOWLEDGEMENTS[0];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export const FS_UNDERSTANDING_COMPLETE = {
  kicker: "Understanding Complete",
  title: "I understand how your business operates.",
  message: [
    "Thank you.",
    "I now have a good understanding of how your business operates.",
    "I already see several opportunities where Chasum can reduce manual work and improve your daily operations.",
    "Let me show you what I would recommend first.",
  ].join(" "),
} as const;
