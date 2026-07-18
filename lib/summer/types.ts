/**
 * Summer AI Receptionist — contracts.
 * Summer is a digital employee, not a chatbot.
 * All booking mutations go through the Booking Engine (channel: summer).
 */

import type { ReceptionistCitation } from "@/lib/ai-receptionist/types";

export type SummerIntent =
  | "greeting"
  | "hours"
  | "services"
  | "employees"
  | "locations"
  | "availability"
  | "booking"
  | "reschedule"
  | "cancel"
  | "customer"
  | "policy"
  | "commerce"
  | "escalate"
  | "general";

export type SummerBookingOption = {
  id: string;
  startIso: string;
  endIso?: string;
  dateLabel: string;
  timeLabel: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  locationId: string;
  locationName?: string;
  price?: number;
};

export type SummerAppointmentCard = {
  id: string;
  startIso: string;
  serviceName: string;
  staffName: string | null;
  status: string;
};

export type SummerConfirmation = {
  appointmentId: string;
  message: string;
  startIso?: string;
  serviceName?: string;
  staffName?: string;
};

export type SummerConflictExplanation = {
  code?: string;
  message: string;
};

export type SummerTurnResult = {
  conversationId: string;
  reply: string;
  intent: SummerIntent;
  provider: string;
  citations: ReceptionistCitation[];
  /** Real slots from Availability Engine only */
  bookingOptions: SummerBookingOption[];
  /** Customer's upcoming appointments (for cancel/reschedule) */
  appointmentCards: SummerAppointmentCard[];
  confirmation: SummerConfirmation | null;
  conflicts: SummerConflictExplanation[];
  escalated: boolean;
  escalationReason: string | null;
  followUpCreated: boolean;
  loggedToCrm: boolean;
  customerRecognized: boolean;
  customerDisplayName: string | null;
  customerId: string | null;
  suggestions: string[];
};

export type SummerSessionContext = {
  businessId: string;
  locationId: string | null;
  conversationId?: string | null;
  customerId?: string | null;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
  /** Pending booking selection awaiting confirm */
  pendingServiceId?: string | null;
  pendingStaffId?: string | null;
};
