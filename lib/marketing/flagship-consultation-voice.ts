/**
 * Meet Summer presentation voice — softens robotic prefixes for display only.
 * Does not change Discovery Engine output or Session Memory.
 */

const ROBOTIC_PREFIXES: Array<{ re: RegExp; to: string | ((m: RegExpMatchArray) => string) }> = [
  {
    re: /^Got it — an? ([^.]+)\.\s*/i,
    to: (m) =>
      `I've taken that in — you're ${/^[aeiou]/i.test(m[1] ?? "") ? "an" : "a"} ${m[1]}. `,
  },
  {
    re: /^Got it — ([^.]+)\.\s*/i,
    to: (m) => `I've learned you're working with ${m[1]}. `,
  },
  {
    re: /^Noted — you're on ([^.]+)\.\s*/i,
    to: (m) => `I see you're currently on ${m[1]}. `,
  },
  {
    re: /^Understood — team size around ([^.]+)\.\s*/i,
    to: (m) => `A team of about ${m[1]} — that shapes how I'll advise you. `,
  },
  {
    re: /^Thanks, ([^.]+)\.\s*/i,
    to: (m) => `Thank you, ${m[1]}. `,
  },
];

/**
 * Present Summer's reply as a consultative advisor — never "Got it…".
 */
export function presentConsultationReply(content: string): string {
  let text = content.trim();
  if (!text) return content;

  for (const rule of ROBOTIC_PREFIXES) {
    const match = text.match(rule.re);
    if (!match) continue;
    const replacement =
      typeof rule.to === "function" ? rule.to(match) : rule.to;
    text = text.replace(rule.re, replacement);
  }

  // Collapse accidental double spaces from replacements
  return text.replace(/\s{2,}/g, " ").trim();
}
