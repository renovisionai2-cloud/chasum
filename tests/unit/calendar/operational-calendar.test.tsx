import { cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DayAgendaList, DayControlCenter } from '@/components/day-view/day-control-center';
import { MonthView, WeekView } from '@/components/calendar/calendar-views';
import { TimelineView, ResourceView } from '@/components/calendar/calendar-views-extended';
import { TimeSlotDropZone, CurrentTimeIndicator } from '@/components/calendar/appointment-block';
import { DayAppointmentCard } from '@/components/day-view/appointment-card';
import { operationalSlot, operationalPosition, resizeOperationalEnd, overlapsOperationalDay, isOperationalDay } from '@/lib/calendar/operational-time';
import { getCurrentTimePosition } from '@/lib/calendar/status-colors';
import { getHourSlots } from '@/lib/calendar/utils';
import { getBusinessTimezone } from '@/lib/locale';
import { parseCalendarDateParam, formatCalendarDateParam } from '@/lib/calendar/date-param';
import type { AppointmentWithRelations, StaffWithServices } from '@/lib/types/booking';
const zone='America/Toronto';
const day=parseCalendarDateParam('2026-09-11');
const appt={id:'test-appointment',start_time:'2026-09-11T16:30:00Z',end_time:'2026-09-11T17:00:00Z',status:'confirmed',staff_id:'staff',location_id:'main',customer:{name:'Test Customer'},service:{name:'Test Service',color:'#123456'},staff:{id:'staff',name:'Test Staff'}} as AppointmentWithRelations;
const staff=[{id:'staff',name:'Test Staff',is_active:true,color:'#123456'}] as StaffWithServices[];
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
describe('operational Reception under the process browser TZ',()=>{
 it('positions the same immutable instant at 12:30, regardless of browser TZ',()=>{
  const {container}=render(<DayControlCenter date={day} timezone={zone} appointments={[appt]} staff={staff} onSelectAppointment={vi.fn()} onSelectSlot={vi.fn()}/>);
  const card=screen.getByRole('button',{name:'Test Customer, Test Service, 12:30 PM, confirmed'});
  expect(parseFloat(card.style.top)).toBeCloseTo(330/900*100);
  expect(appt.start_time).toBe('2026-09-11T16:30:00Z');
  expect(container.querySelectorAll('[data-staff-column="staff"] button')).toHaveLength(16); // 15 hour slots + appointment
 });
 it('uses location override and business zone for All Locations',()=>{
  const business='America/Toronto',location='America/Los_Angeles';
  const single=getBusinessTimezone({timezone:business,locationTimezone:location});
  const all=getBusinessTimezone({timezone:business});
  expect(operationalPosition(appt.start_time,appt.end_time,day,single).top).toBeCloseTo(150/900*100);
  expect(operationalPosition(appt.start_time,appt.end_time,day,all).top).toBeCloseTo(330/900*100);
 });
 it('groups near-midnight appointments on their operational date in mobile/day lists',()=>{
  const late={...appt,start_time:'2026-09-12T03:30:00Z',end_time:'2026-09-12T03:55:00Z'};
  render(<DayAgendaList date={day} timezone={zone} appointments={[late]} onSelectAppointment={vi.fn()}/>);
  expect(screen.getByText(/11:30 PM/)).toBeVisible();
  expect(overlapsOperationalDay(late.start_time,late.end_time,parseCalendarDateParam('2026-09-12'),zone)).toBe(false);
 });
 it.each([WeekView, MonthView, TimelineView])('passes the operational zone through view %s',View=>{
  render(<View date={day} timezone={zone} appointments={[appt]} onSelectAppointment={vi.fn()} onSelectSlot={vi.fn()} onSelectDay={vi.fn()}/>);
  expect(screen.getByRole('button',{name:/12:30 PM/})).toBeVisible();
 });
 it('renders location columns in the shared business zone',()=>{
  render(<ResourceView date={day} timezone={zone} appointments={[appt]} staff={staff} mode="employees" onSelectAppointment={vi.fn()}/>);
  expect(screen.getByRole('button',{name:/12:30 PM/})).toBeVisible();
 });
 it('places the now marker in the operational timezone',()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-11T16:30:00Z'));
  expect(isOperationalDay(new Date(),day,zone)).toBe(true);
  expect(getCurrentTimePosition(7,22,zone)).toBeCloseTo(330/900*100);
  const {container}=render(<CurrentTimeIndicator show timezone={zone} autoScroll={false}/>);
  expect(parseFloat((container.firstChild as HTMLElement).style.top)).toBeCloseTo(330/900*100);
 });
 it('drops and clicks at the represented wall time, producing a real instant',()=>{
  const onDrop=vi.fn(),onClick=vi.fn();
  render(<TimeSlotDropZone date={day} hour={13} timezone={zone} intervalMinutes={30} onClick={onClick} onDrop={onDrop}/>);
  const target=screen.getByRole('button');vi.spyOn(target,'getBoundingClientRect').mockReturnValue({top:0,height:100} as DOMRect);
  const drop=createEvent.drop(target,{dataTransfer:{getData:()=>appt.id}});Object.defineProperty(drop,'clientY',{value:50});fireEvent(target,drop);
  expect(onDrop.mock.calls[0][0].toISOString()).toBe('2026-09-11T17:30:00.000Z');
  fireEvent.click(target,{clientY:50});expect(onClick.mock.calls[0][0].toISOString()).toBe('2026-09-11T17:30:00.000Z');
 });
 it('rejects spring gaps and autumn repeated wall times without a mutation callback',()=>{
  expect(operationalSlot(parseCalendarDateParam('2026-03-08'),150,zone)).toBeNull();
  expect(operationalSlot(parseCalendarDateParam('2026-11-01'),90,zone)).toBeNull();
  const onDrop=vi.fn();render(<TimeSlotDropZone date={parseCalendarDateParam('2026-03-08')} hour={2} timezone={zone} onDrop={onDrop} onClick={vi.fn()}/>);
  const target=screen.getByRole('button');vi.spyOn(target,'getBoundingClientRect').mockReturnValue({top:0,height:100} as DOMRect);
  const drop=createEvent.drop(target,{dataTransfer:{getData:()=>appt.id}});Object.defineProperty(drop,'clientY',{value:50});fireEvent(target,drop);
  expect(onDrop).not.toHaveBeenCalled();expect(screen.getByRole('status')).toHaveTextContent('ambiguous');
 });
 it.each([['2026-03-08','2026-03-08T11:00:00.000Z'],['2026-11-01','2026-11-01T12:00:00.000Z']])('converts daytime slots adjacent to DST on %s',(date,expected)=>{
  expect(operationalSlot(parseCalendarDateParam(date),420,zone)?.toISOString()).toBe(expected);
 });
 it('resizes across DST by the visible wall-clock delta, rejecting ambiguous endpoints',()=>{
  expect(resizeOperationalEnd(new Date('2026-03-08T06:30Z'),120,zone)?.toISOString()).toBe('2026-03-08T07:30:00.000Z');
  expect(resizeOperationalEnd(new Date('2026-11-01T04:30Z'),60,zone)).toBeNull();
  expect(resizeOperationalEnd(new Date(appt.end_time),30,zone)?.toISOString()).toBe('2026-09-11T17:30:00.000Z');
 });
 it('clips supplied multi-day blocks to the selected operational day',()=>{
  expect(operationalPosition('2026-09-11T03:30Z','2026-09-11T12:00Z',day,zone)).toEqual({top:0,height:60/900*100});
  expect(overlapsOperationalDay('2026-09-11T03:30Z','2026-09-11T04:00Z',day,zone)).toBe(false);
 });
 it('keeps URL civil dates and the visible 7–22 axis consistent',()=>{
  expect(formatCalendarDateParam(day)).toBe('2026-09-11');expect(getHourSlots()).toEqual(Array.from({length:15},(_,i)=>i+7));
 });
 it('resizes through the real pointer handler to the represented operational end',()=>{
  const onResize=vi.fn();
  const {container}=render(<div><DayAppointmentCard day={day} timezone={zone} appointment={appt} onResize={onResize} onSelect={vi.fn()}/></div>);
  Object.defineProperty(container.firstChild,'clientHeight',{value:900});
  fireEvent(screen.getByRole('separator'),new MouseEvent('pointerdown',{bubbles:true,clientY:0}));
  fireEvent(window,new MouseEvent('pointerup',{bubbles:true,clientY:30}));
  expect(onResize).toHaveBeenCalledTimes(1);
  expect(onResize.mock.calls[0][1].toISOString()).toBe('2026-09-11T17:30:00.000Z');
  expect(screen.getByRole('separator',{name:'Resize duration'})).toBeVisible();
  expect(screen.getByRole('button',{name:/12:30 PM/})).toBeVisible();
 });
});
