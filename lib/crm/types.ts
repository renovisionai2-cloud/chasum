import type { CommunicationRecord, FollowUpReminder } from "@/lib/communication/types";
import type {
  AppointmentStatus,
  CustomerDocument,
} from "@/lib/types/booking";

export type CrmStatus = "lead" | "active" | "inactive" | "vip" | "archived";

export type LoyaltyStatus =
  | "standard"
  | "silver"
  | "gold"
  | "platinum"
  | "member";

export type PreferredCommunicationMethod = "call" | "sms" | "email" | "any";

export type CrmNoteType = "general" | "warning" | "medical" | "service";

export type CrmCustomerNote = {
  id: string;
  businessId: string;
  customerId: string;
  body: string;
  noteType: CrmNoteType;
  isPinned: boolean;
  isPrivate: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CRM_NOTE_TYPE_LABELS: Record<CrmNoteType, string> = {
  general: "General",
  warning: "Warning",
  medical: "Medical",
  service: "Service",
};

export type CrmPaymentEvent = {
  id: string;
  businessId: string;
  customerId: string;
  appointmentId: string | null;
  amountCents: number;
  currency: string;
  status: string;
  method: string | null;
  description: string | null;
  provider: string | null;
  occurredAt: string;
  createdAt: string;
};

export type CrmTimelineItemType =
  | "appointment"
  | "call"
  | "sms"
  | "email"
  | "note"
  | "document"
  | "payment"
  | "cancellation"
  | "no_show"
  | "reminder"
  | "other";

export type CrmTimelineItem = {
  id: string;
  type: CrmTimelineItemType;
  title: string;
  body?: string | null;
  status?: string | null;
  occurredAt: string;
  href?: string | null;
  meta?: Record<string, unknown>;
};

export type CrmInsights = {
  lifetimeRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  averageSpend: number;
  noShowRate: number;
  cancellationRate: number;
  preferredEmployeeName: string | null;
  preferredServiceName: string | null;
  preferredLocationName: string | null;
  lastVisit: string | null;
  nextAppointment: string | null;
  upcomingCount: number;
  cancellationCount: number;
  noShowCount: number;
};

export type CrmAppointmentBucket = {
  id: string;
  start_time: string;
  end_time?: string;
  status: AppointmentStatus;
  staff_id?: string;
  location_id?: string;
  service_id?: string;
  recurring_rule_id?: string | null;
  service?: { name?: string; price?: number } | null;
  staff?: { name?: string } | null;
  location?: { name?: string } | null;
};

export type CrmProfile = {
  customer: Record<string, unknown> & {
    id: string;
    business_id: string;
    name: string;
    email: string;
    phone: string | null;
    address?: string | null;
    notes: string | null;
    tags: string[];
    referral_source: string | null;
    first_name?: string | null;
    last_name?: string | null;
    preferred_name?: string | null;
    photo_url?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relationship?: string | null;
    preferred_communication_method?: PreferredCommunicationMethod | null;
    crm_status?: CrmStatus;
    assigned_staff_id?: string | null;
    preferred_location_id?: string | null;
    is_vip?: boolean;
    anniversary_date?: string | null;
    loyalty_status?: LoyaltyStatus;
    marketing_consent?: boolean;
    marketing_consent_at?: string | null;
    membership_id?: string | null;
    last_activity_at?: string | null;
    created_at: string;
    updated_at: string;
  };
  assignedStaff?: { id: string; name: string } | null;
  preferredLocation?: { id: string; name: string } | null;
  membership?: { id: string; name: string } | null;
  documents: CustomerDocument[];
  notes: CrmCustomerNote[];
  payments: CrmPaymentEvent[];
  communications: {
    history: CommunicationRecord[];
    followUps: FollowUpReminder[];
    emailHistory: CommunicationRecord[];
    smsHistory: CommunicationRecord[];
    reminderHistory: CommunicationRecord[];
    notes: CommunicationRecord[];
  };
  appointments: {
    all: CrmAppointmentBucket[];
    upcoming: CrmAppointmentBucket[];
    completed: CrmAppointmentBucket[];
    cancelled: CrmAppointmentBucket[];
    noShows: CrmAppointmentBucket[];
    recurring: CrmAppointmentBucket[];
  };
  timeline: CrmTimelineItem[];
  insights: CrmInsights;
};

export const CRM_STATUS_LABELS: Record<CrmStatus, string> = {
  lead: "Lead",
  active: "Active",
  inactive: "Inactive",
  vip: "VIP",
  archived: "Archived",
};

export const LOYALTY_STATUS_LABELS: Record<LoyaltyStatus, string> = {
  standard: "Standard",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  member: "Member",
};

export const COMM_METHOD_LABELS: Record<PreferredCommunicationMethod, string> = {
  call: "Call",
  sms: "SMS",
  email: "Email",
  any: "Any",
};
