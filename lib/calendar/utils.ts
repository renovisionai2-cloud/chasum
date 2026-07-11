import {
  addMinutes,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { BusinessHours } from "@/lib/types/booking";

export const CALENDAR_START_HOUR = 7;
export const CALENDAR_END_HOUR = 21;
export const SLOT_INTERVAL_MINUTES = 30;

export function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

export function formatDateShort(date: Date): string {
  return format(date, "MMM d");
}

export function formatDayHeader(date: Date): string {
  return format(date, "EEEE, MMM d");
}

export function formatWeekRange(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getHourSlots(): number[] {
  const slots: number[] = [];
  for (let hour = CALENDAR_START_HOUR; hour <= CALENDAR_END_HOUR; hour++) {
    slots.push(hour);
  }
  return slots;
}

export function parseTimeOnDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return setMinutes(setHours(date, hours), minutes);
}

export function getAppointmentPosition(
  startTime: string,
  endTime: string,
): { top: number; height: number } {
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  const startMinutes =
    start.getHours() * 60 + start.getMinutes() - CALENDAR_START_HOUR * 60;
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  const totalMinutes = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;

  return {
    top: (startMinutes / totalMinutes) * 100,
    height: Math.max((durationMinutes / totalMinutes) * 100, 3),
  };
}

export function isWithinBusinessHours(
  date: Date,
  hours: BusinessHours[],
): boolean {
  const dayHours = hours.find((h) => h.day_of_week === date.getDay());
  if (!dayHours?.is_open) return false;

  const open = parseTimeOnDate(date, dayHours.open_time);
  const close = parseTimeOnDate(date, dayHours.close_time);
  return date >= open && date < close;
}

export function generateTimeSlots(
  date: Date,
  hours: BusinessHours[],
  durationMinutes: number,
  existingAppointments: { start_time: string; end_time: string; staff_id: string }[],
  staffId: string,
): Date[] {
  const dayHours = hours.find((h) => h.day_of_week === date.getDay());
  if (!dayHours?.is_open) return [];

  const open = parseTimeOnDate(date, dayHours.open_time);
  const close = parseTimeOnDate(date, dayHours.close_time);
  const slots: Date[] = [];
  let cursor = open;

  while (addMinutes(cursor, durationMinutes) <= close) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    const hasConflict = existingAppointments.some((appt) => {
      if (appt.staff_id !== staffId) return false;
      const apptStart = parseISO(appt.start_time);
      const apptEnd = parseISO(appt.end_time);
      return cursor < apptEnd && slotEnd > apptStart;
    });

    if (!hasConflict && cursor > new Date()) {
      slots.push(new Date(cursor));
    }

    cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
  }

  return slots;
}

export { isSameDay, isSameMonth, startOfDay, endOfDay, parseISO, addMinutes };
