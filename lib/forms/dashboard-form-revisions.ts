import { parseAiSettings, parseBookingPageBranding } from "@/lib/business/settings";
import { persistedFormRevision } from "@/lib/forms/persisted-form-revision";
import type { EmployeeProfile } from "@/lib/employees/types";
import type { Business } from "@/lib/types/booking";

export function businessHubProfileRevision(business: Business): string {
  return persistedFormRevision({
    updatedAt: business.updated_at,
    name: business.name,
    legalName: business.legal_name ?? null,
    slug: business.slug,
    businessType: business.business_type ?? null,
    description: business.description ?? null,
    industry: business.industry ?? null,
    language: business.language ?? null,
    website: business.website ?? null,
    email: business.email ?? null,
    phone: business.phone ?? null,
    taxNumber: business.tax_number ?? null,
    currency: business.currency ?? null,
    timezone: business.timezone,
    addressLine1: business.address_line1 ?? null,
    addressLine2: business.address_line2 ?? null,
    city: business.city ?? null,
    state: business.state ?? null,
    postalCode: business.postal_code ?? null,
    country: business.country ?? null,
    instagram: business.social_links?.instagram ?? null,
    facebook: business.social_links?.facebook ?? null,
    tiktok: business.social_links?.tiktok ?? null,
    youtube: business.social_links?.youtube ?? null,
    twitter: business.social_links?.twitter ?? null,
    logoUrl: business.logo_url ?? null,
    coverUrl: business.cover_url ?? null,
  });
}

export function settingsBusinessProfileRevision(business: Business): string {
  return persistedFormRevision({
    updatedAt: business.updated_at,
    name: business.name,
    slug: business.slug,
    timezone: business.timezone,
    website: business.website ?? null,
    phone: business.phone ?? null,
    email: business.email ?? null,
    addressLine1: business.address_line1 ?? null,
    addressLine2: business.address_line2 ?? null,
    city: business.city ?? null,
    state: business.state ?? null,
    postalCode: business.postal_code ?? null,
    country: business.country ?? null,
    instagram: business.social_links?.instagram ?? null,
    facebook: business.social_links?.facebook ?? null,
    tiktok: business.social_links?.tiktok ?? null,
    youtube: business.social_links?.youtube ?? null,
    description: business.description ?? null,
    bookingPolicy: business.booking_policy ?? null,
    cancellationPolicy: business.cancellation_policy ?? null,
    publicBookingMode: business.public_booking_mode ?? null,
    bookingInviteCode: business.booking_invite_code ?? null,
    logoUrl: business.logo_url ?? null,
    coverUrl: business.cover_url ?? null,
  });
}

export function notificationSettingsRevision(business: Business): string {
  return persistedFormRevision({
    updatedAt: business.updated_at,
    emailNotificationsEnabled: business.email_notifications_enabled ?? null,
    smsNotificationsEnabled: business.sms_notifications_enabled ?? null,
    marketingEmailEnabled: business.marketing_email_enabled ?? null,
    ownerNotificationsEnabled: business.owner_notifications_enabled ?? null,
    staffNotificationsEnabled: business.staff_notifications_enabled ?? null,
    reminderHoursBefore: business.reminder_hours_before ?? null,
    notificationEmail: business.notification_email ?? null,
    quietHoursStart: business.quiet_hours_start ?? null,
    quietHoursEnd: business.quiet_hours_end ?? null,
    communicationsOptOutFooter: business.communications_opt_out_footer ?? null,
  });
}

export function brandingSettingsRevision(business: Business): string {
  const branding = parseBookingPageBranding(business.booking_page_branding);
  return persistedFormRevision({
    updatedAt: business.updated_at,
    logoUrl: business.logo_url ?? null,
    faviconUrl: business.favicon_url ?? null,
    coverUrl: business.cover_url ?? null,
    brandColor: business.brand_color ?? null,
    accentColor: business.accent_color ?? null,
    emailSignature: business.email_signature ?? null,
    headline: branding.headline ?? null,
    primaryButtonLabel: branding.primary_button_label ?? null,
    showLogo: branding.show_logo ?? null,
    showCover: branding.show_cover ?? null,
  });
}

export function aiSettingsRevision(business: Business): string {
  const ai = parseAiSettings(business.ai_settings);
  return persistedFormRevision({
    updatedAt: business.updated_at,
    summerEnabled: ai.summer.enabled,
    summerGreeting: ai.summer.greeting,
    summerTone: ai.summer.tone,
    summerEscalation: ai.summer.escalation,
    summerBusinessKnowledge: ai.summer.business_knowledge,
    chaseEnabled: ai.chase.enabled,
    chaseDailySummary: ai.chase.daily_summary,
    chaseWeeklySummary: ai.chase.weekly_summary,
    chaseRecommendations: ai.chase.recommendations,
    chaseBusinessAnalytics: ai.chase.business_analytics,
  });
}

export function employeeProfileFormRevision(employee: EmployeeProfile): string {
  return persistedFormRevision({
    updatedAt: employee.updated_at,
    firstName: employee.first_name ?? null,
    lastName: employee.last_name ?? null,
    preferredName: employee.preferred_name ?? null,
    title: employee.title ?? null,
    email: employee.email ?? null,
    phone: employee.phone ?? null,
    photoUrl: employee.photo_url ?? null,
    departmentId: employee.department_id ?? null,
    employmentStatus: employee.employment_status,
    hireDate: employee.hire_date ?? null,
    isActive: employee.is_active,
    emergencyContactName: employee.emergency_contact_name ?? null,
    emergencyContactPhone: employee.emergency_contact_phone ?? null,
    emergencyContactRelationship: employee.emergency_contact_relationship ?? null,
    color: employee.color,
    biography: employee.biography ?? null,
    qualifications: employee.qualifications ?? null,
    roleKey: employee.role_key,
    permissions: [...employee.permissions].sort(),
    bookingRules: {
      maxAppointmentsPerDay: employee.booking_rules.max_appointments_per_day ?? null,
      minBreakMinutes: employee.booking_rules.min_break_minutes,
      bufferBeforeMinutes: employee.booking_rules.buffer_before_minutes,
      bufferAfterMinutes: employee.booking_rules.buffer_after_minutes,
      priorityScheduling: employee.booking_rules.priority_scheduling,
      acceptOnlineBookings: employee.booking_rules.accept_online_bookings,
      acceptNewClients: employee.booking_rules.accept_new_clients,
      acceptWalkIns: employee.booking_rules.accept_walk_ins,
      overtimeEligible: employee.booking_rules.overtime_eligible,
    },
    locationId: employee.location_id,
    locationIds: employee.staff_locations.map((row) => row.location_id).sort(),
    services: employee.staff_services
      .map((row) => ({
        id: row.service_id,
        price: row.price_override ?? null,
        duration: row.duration_override_minutes ?? null,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    payType: employee.pay_type,
    hourlyRateCents: employee.hourly_rate_cents ?? null,
    salaryCents: employee.salary_cents ?? null,
    commissionRateBps: employee.commission_rate_bps ?? null,
    payrollNotes: employee.payroll_notes ?? null,
  });
}

export function customerMarketingFormRevision(customer: {
  tags?: string[] | null;
  referral_source?: string | null;
  loyalty_status?: string | null;
  membership_id?: string | null;
  anniversary_date?: string | null;
  date_of_birth?: string | null;
  is_vip?: boolean | null;
  marketing_consent?: boolean | null;
  updated_at?: string | null;
}): string {
  return persistedFormRevision({
    updatedAt: customer.updated_at ?? null,
    tags: [...(customer.tags ?? [])].sort(),
    referralSource: customer.referral_source ?? null,
    loyaltyStatus: customer.loyalty_status ?? null,
    membershipId: customer.membership_id ?? null,
    anniversaryDate: customer.anniversary_date ?? null,
    dateOfBirth: customer.date_of_birth ?? null,
    isVip: customer.is_vip ?? null,
    marketingConsent: customer.marketing_consent ?? null,
  });
}
