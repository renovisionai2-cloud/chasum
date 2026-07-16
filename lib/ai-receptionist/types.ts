export type ReceptionistChannel = "web" | "sms" | "email" | "voice" | "internal";

export type ReceptionistConversationStatus =
  | "open"
  | "escalated"
  | "resolved"
  | "archived";

export type ReceptionistIntent =
  | "greeting"
  | "hours"
  | "services"
  | "employees"
  | "locations"
  | "availability"
  | "booking"
  | "policy"
  | "escalate"
  | "general";

export type ReceptionistMessageRole = "user" | "assistant" | "system" | "staff";

export type SuggestedSlot = {
  date: string;
  timeLabel: string;
  startIso: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
};

export type ReceptionistCitation = {
  source: "hours" | "services" | "staff" | "locations" | "policy" | "availability";
  label: string;
};

export type ReceptionistConversation = {
  id: string;
  business_id: string;
  location_id: string | null;
  customer_id: string | null;
  channel: ReceptionistChannel;
  status: ReceptionistConversationStatus;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  intent: string | null;
  booking_started: boolean;
  escalated_at: string | null;
  escalation_reason: string | null;
  follow_up_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ReceptionistMessage = {
  id: string;
  business_id: string;
  conversation_id: string;
  role: ReceptionistMessageRole;
  content: string;
  intent: string | null;
  provider: string | null;
  citations: ReceptionistCitation[];
  suggested_slots: SuggestedSlot[];
  metadata: Record<string, unknown>;
  created_at: string;
};

export type BusinessKnowledge = {
  businessId: string;
  businessName: string;
  slug: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  cancellationPolicy: string | null;
  bookingPolicy: string | null;
  address: string | null;
  bookingUrl: string;
  hours: Array<{
    dayOfWeek: number;
    dayLabel: string;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }>;
  locations: Array<{
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    isDefault: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: number;
    category: string | null;
  }>;
  employees: Array<{
    id: string;
    name: string;
    title: string | null;
    serviceIds: string[];
  }>;
};

export type ReceptionistTurnResult = {
  conversationId: string;
  reply: string;
  intent: ReceptionistIntent;
  provider: string;
  citations: ReceptionistCitation[];
  suggestedSlots: SuggestedSlot[];
  bookingUrl: string | null;
  escalated: boolean;
  followUpCreated: boolean;
  loggedToCrm: boolean;
};
