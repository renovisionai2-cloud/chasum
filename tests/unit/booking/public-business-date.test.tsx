import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicBookingPage } from '@/components/booking/public-booking-page';
import type { Business, Location, Service, StaffWithServices } from '@/lib/types/booking';
const { slots }=vi.hoisted(()=>({slots:vi.fn().mockResolvedValue([{start:'2026-09-11T16:30:00Z',staffId:'staff',staffName:'Test Staff'}])}));
vi.mock('@/lib/actions/public-booking',()=>({getPublicSlotOptions:slots,bookAppointment:vi.fn(),lookupPublicCustomer:vi.fn()}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const business={name:'Test Studio',slug:'test-studio',timezone:'America/Toronto',currency:'cad'} as Business;
const location={id:'location',name:'Main',timezone:null,is_default:true} as Location;
const service={id:'service',location_id:'location',name:'Test Service',duration_minutes:30,price:25} as Service;
const staff={id:'staff',location_id:'location',name:'Test Staff',staff_services:[{service_id:'service'}]} as StaffWithServices;
describe('public business-date wiring',()=>{
 it('sends the clicked date unchanged and displays the slot in the operational zone',async()=>{
  render(<PublicBookingPage business={business} initialNow="2026-09-11T15:00:00Z" locations={[location]} services={[service]} staff={[staff]}/>);
  fireEvent.click(screen.getByRole('button',{name:/Test Service/}));
  fireEvent.click(screen.getByRole('button',{name:/Test Staff/}));
  const first=screen.getByRole('button',{name:'Fri11Sep'});expect(first).toBeVisible();
  fireEvent.click(first);fireEvent.click(screen.getByRole('button',{name:'Continue to times'}));
  await waitFor(()=>expect(slots).toHaveBeenCalledWith(expect.objectContaining({date:'2026-09-11',locationId:'location',staffId:'staff'})));
  fireEvent.click(screen.getByRole('button',{name:"Available time"}));
  const time = await screen.findByRole('option', { name: '12:30 PM' });
  fireEvent.click(time);
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Customer' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.test' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review booking' }));
  expect(screen.getByText('Friday, Sep 11 at 12:30 PM')).toBeVisible();
  expect(document.querySelector('input[name="start_time"]')).toHaveValue('2026-09-11T16:30:00Z');
 });
 it('uses the selected location timezone for the initial date chips',()=>{
  render(<PublicBookingPage business={business} initialNow="2026-09-11T15:00:00Z" locations={[{...location,timezone:'Pacific/Auckland'}]} services={[service]} staff={[staff]}/>);
  fireEvent.click(screen.getByRole('button',{name:/Test Service/}));fireEvent.click(screen.getByRole('button',{name:/Test Staff/}));
  expect(screen.getByRole('button',{name:'Sat12Sep'})).toBeVisible();
 });
});
