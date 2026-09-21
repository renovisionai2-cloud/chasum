import type { ReasonCode } from "./contracts";
export function normalizeTimezone(zone: string): string | null {
    try {
        return new Intl.DateTimeFormat("en", { timeZone: zone.trim() }).resolvedOptions().timeZone;
    }
    catch {
        return null;
    }
}
type TimeResult = {
    iso: string;
    error?: never;
} | {
    error: ReasonCode;
    iso?: never;
};
/** Strict ISO wall time, second precision. Date-only, rollover and implicit host zone rejected. */
export function resolveTimestamp(value: string, timezone: string, requireOffsetConsistency = false): TimeResult {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.000)?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
    if (!m)
        return { error: "INVALID_TIMESTAMP" };
    const [, y, mo, d, h, mi, s = "00", offset] = m;
    const wall = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
    const nominal = Date.parse(wall + "Z");
    if (!Number.isFinite(nominal) || new Date(nominal).toISOString().slice(0, 19) !== wall)
        return { error: "INVALID_TIMESTAMP" };
    if (offset) {
        if (offset !== "Z" && (Number(offset.slice(1, 3)) > 14 || Number(offset.slice(4)) > 59 || (Number(offset.slice(1, 3)) === 14 && Number(offset.slice(4)) !== 0)))
            return { error: "INVALID_TIMESTAMP" };
        const n = Date.parse(wall + offset);
        if (requireOffsetConsistency && Number.isFinite(n)) {
            const zone = normalizeTimezone(timezone);
            if (!zone) return { error: "INVALID_TIMEZONE" };
            const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(n).map(p => [p.type, p.value]));
            if (`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}` !== wall)
                return { error: "INVALID_TIMESTAMP" };
        }
        return Number.isFinite(n) ? { iso: new Date(n).toISOString() } : { error: "INVALID_TIMESTAMP" };
    }
    const zone = normalizeTimezone(timezone);
    if (!zone)
        return { error: "INVALID_TIMEZONE" };
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    const rendered = (n: number) => {
        const p = Object.fromEntries(fmt.formatToParts(n).map(x => [x.type, x.value]));
        return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
    };
    // Discover offsets on both sides of transitions, including non-hour/24h jumps.
    const offsets = new Set<number>();
    for (let hours = -48; hours <= 48; hours += 6) {
        const n = nominal + hours * 3600000;
        offsets.add(Date.parse(rendered(n) + "Z") - n);
    }
    const candidates = [...offsets].map(o => nominal - o).filter(n => rendered(n) === wall);
    if (!candidates.length)
        return { error: "DST_NONEXISTENT" };
    if (candidates.length > 1)
        return { error: "DST_AMBIGUOUS" };
    return { iso: new Date(candidates[0]).toISOString() };
}
