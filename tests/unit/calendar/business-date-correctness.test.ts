import { describe, expect, it } from "vitest";
import { addCalendarDays, businessDateChips, calendarDateInTimezone, calendarDayStart, formatCalendarDay } from "@/lib/business/datetime";
import { getBusinessTimezone, formatBusinessTime } from "@/lib/locale";
import { formatCalendarDateParam, parseCalendarDateParam, resolveCalendarDateValue } from "@/lib/calendar/date-param";
import { timeOfDayGroupId } from "@/lib/booking/time-groups";

// Run this suite in separate TZ processes as well as the normal test runner.
describe('operational civil dates', () => {
  it.each([
    ['2026-09-11T15:00:00Z','2026-09-11'],
    ['2026-09-11T02:00:00Z','2026-09-10'],
    ['2026-03-08T06:59:00Z','2026-03-08'],
    ['2026-03-08T07:01:00Z','2026-03-08'],
    ['2026-11-01T05:59:00Z','2026-11-01'],
    ['2026-11-01T06:01:00Z','2026-11-01'],
  ])('resolves %s independently of runtime timezone', (instant, expected) => {
    expect(calendarDateInTimezone(instant,'America/Toronto')).toBe(expected);
    expect(businessDateChips(instant,'America/Toronto')[0].value).toBe(expected);
  });
  it('prefers location and falls back to business', () => {
    const instant='2026-09-11T15:00:00Z';
    expect(calendarDateInTimezone(instant,getBusinessTimezone({timezone:'America/Toronto',locationTimezone:'Pacific/Auckland'}))).toBe('2026-09-12');
    expect(calendarDateInTimezone(instant,getBusinessTimezone({timezone:'America/Toronto',locationTimezone:null}))).toBe('2026-09-11');
  });
  it.each(['2026-03-01T17:00:00Z','2026-10-25T16:00:00Z'])('has 14 consecutive civil chips across DST: %s', instant => {
    const chips=businessDateChips(instant,'America/Toronto');
    expect(chips).toHaveLength(14);expect(new Set(chips.map(c=>c.value)).size).toBe(14);
    chips.forEach((c,i)=>expect(c.value).toBe(addCalendarDays(chips[0].value,i)));
  });
  it('handles calendar rollovers and rejects malformed civil dates',()=>{
    expect(addCalendarDays('2026-12-31',1)).toBe('2027-01-01');
    expect(addCalendarDays('2028-02-28',1)).toBe('2028-02-29');
    expect(()=>addCalendarDays('2026-02-30',0)).toThrow();
    expect(formatCalendarDay('2026-09-11',{weekday:'long'})).toBe('Friday');
  });
  it('preserves :30 slot clock and time-of-day grouping in the service zone',()=>{
    const slot='2026-09-11T16:30:00Z';
    expect(formatBusinessTime(slot,{timezone:'America/Toronto'})).toBe('12:30 PM');
    expect(timeOfDayGroupId(slot,'America/Toronto')).toBe('afternoon');
    expect(timeOfDayGroupId('2026-09-11T14:30:00Z','America/Toronto')).toBe('morning');
  });
  it('queries 23/25 hour business days rather than runtime-local 24-hour ranges',()=>{
    for(const [day,hours] of [['2026-03-08',23],['2026-11-01',25]] as const){
      const a=calendarDayStart(day,'America/Toronto');
      const b=calendarDayStart(addCalendarDays(day,1),'America/Toronto');
      expect((b.getTime()-a.getTime())/3600000).toBe(hours);
    }
  });
  it('handles Auckland DST and non-hour timezone offsets at query boundaries',()=>{
    const a=calendarDayStart('2026-09-27','Pacific/Auckland');
    const b=calendarDayStart('2026-09-28','Pacific/Auckland');
    expect(a.toISOString()).toBe('2026-09-26T12:00:00.000Z');
    expect((b.getTime()-a.getTime())/3600000).toBe(23);
    expect(calendarDayStart('2026-09-11','Asia/Kathmandu').toISOString()).toBe('2026-09-10T18:15:00.000Z');
  });
  it('keeps Reception URL and RSC civil dates stable, with business Today',()=>{
    const value=resolveCalendarDateValue(undefined,'America/Toronto',new Date('2026-09-11T02:00:00Z'));
    expect(value).toBe('2026-09-10');
    expect(formatCalendarDateParam(parseCalendarDateParam('2026-09-11'))).toBe('2026-09-11');
    expect(resolveCalendarDateValue('2026-09-11T00:00:00Z','America/Toronto')).toBe('2026-09-10');
    expect(resolveCalendarDateValue('2026-09-11','America/Toronto')).toBe('2026-09-11');
  });
});
