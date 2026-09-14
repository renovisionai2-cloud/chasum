import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CalendarToolbar } from '@/components/calendar/calendar-toolbar';
import { parseCalendarDateParam, formatCalendarDateParam } from '@/lib/calendar/date-param';
afterEach(()=>{cleanup();vi.useRealTimers();});
it('uses the operational date for Today and preserves explicit jump dates',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-11T02:00:00Z'));
 const onDateChange=vi.fn();
 render(<CalendarToolbar date={parseCalendarDateParam('2026-09-11')} timezone="America/Toronto" view="day" colorMode="service" onDateChange={onDateChange} onViewChange={vi.fn()} onColorModeChange={vi.fn()} onNewAppointment={vi.fn()}/>);
 expect(screen.getByLabelText('Jump to date')).toHaveValue('2026-09-11');
 fireEvent.click(screen.getByRole('button',{name:'Today'}));
 expect(formatCalendarDateParam(onDateChange.mock.calls[0][0])).toBe('2026-09-10');
 fireEvent.change(screen.getByLabelText('Jump to date'),{target:{value:'2026-09-12'}});
 expect(formatCalendarDateParam(onDateChange.mock.calls[1][0])).toBe('2026-09-12');
});
