/** Minimal RFC5545 VEVENT builder — safe for client and server. */
export function buildSimpleIcsEvent(input: {
  id: string;
  title: string;
  description?: string;
  location?: string | null;
  startTime: string;
  endTime: string;
}): string {
  const stamp = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const escape = (value: string) =>
    value
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chasum//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.id}@chasum.app`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(input.startTime)}`,
    `DTEND:${stamp(input.endTime)}`,
    `SUMMARY:${escape(input.title)}`,
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escape(input.description)}`);
  }
  if (input.location) {
    lines.push(`LOCATION:${escape(input.location)}`);
  }

  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
