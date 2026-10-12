import { addCalendarDays, calendarDateInTimezone, calendarDayStart } from "@/lib/business/datetime";
import type { FinancialPeriod } from "./financial-aggregate/types";
export type FinancialPeriodName = "today" | "yesterday" | "week" | "previousWeek" | "month" | "previousMonth" | "year";
/** Civil boundaries, including DST, converted once. No local/server timezone fallback. */
export function financialPeriod(name: FinancialPeriodName, timezone: string, now = new Date()): FinancialPeriod {
    if (!timezone || !Number.isFinite(now.getTime()))
        throw new RangeError("Financial time authority unavailable");
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format(now);
    const today = calendarDateInTimezone(now, timezone);
    let from = today;
    let to = addCalendarDays(today, 1);
    if (name === "yesterday") {
        from = addCalendarDays(today, -1);
        to = today;
    }
    if (name === "week" || name === "previousWeek") {
        const day = new Date(`${today}T12:00:00Z`).getUTCDay();
        from = addCalendarDays(today, -day);
        if (name === "previousWeek") {
            to = from;
            from = addCalendarDays(from, -7);
        }
    }
    if (name === "month")
        from = `${today.slice(0, 7)}-01`;
    if (name === "previousMonth") {
        to = `${today.slice(0, 7)}-01`;
        from = `${addCalendarDays(to, -1).slice(0, 7)}-01`;
    }
    if (name === "year")
        from = `${today.slice(0, 4)}-01-01`;
    return { from: calendarDayStart(from, timezone).toISOString(), to: calendarDayStart(to, timezone).toISOString(), timezone };
}
