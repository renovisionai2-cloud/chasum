import type { OperatorServiceCatalogItem } from "@/lib/services/operator-catalog";
import type { Customer, Location, StaffWithServices } from "@/lib/types/booking";
export const location = {
  id: "loc",
  business_id: "biz",
  name: "Test Location",
  slug: "test-location",
  timezone: "America/Toronto",
  is_default: true,
  is_active: true,
  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  postal_code: null,
  phone: null,
  metadata: {},
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
} as Location;

export const customer = {
  id: "cust",
  business_id: "biz",
  name: "Test Customer",
  email: "test@example.test",
  phone: null,
  notes: null,
  tags: [],
  referral_source: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
} as Customer;

export const service = {
  id: "svc",
  business_id: "biz",
  name: "Deposit Service",
  is_active: true,
  duration_minutes: 30,
  price: 220,
  color: "#000000",
  online_booking: true,
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  location_id: "loc",
  service_locations: [{ location_id: "loc" }],
  deposit_required: true,
  deposit_cents: 5000,
  tax_rate_bps: 1300,
} as unknown as OperatorServiceCatalogItem;

export const staff = {
  id: "staff",
  business_id: "biz",
  name: "Test Staff",
  title: null,
  photo_url: null,
  biography: null,
  qualifications: null,
  color: "#000000",
  is_active: true,
  location_id: "loc",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  staff_locations: [{ location_id: "loc" }],
  staff_services: [{ service_id: "svc" }],
} as StaffWithServices;
