/** Channels supported by the Communication Center (providers plug in later). */
export type CommunicationChannel =
  | "call"
  | "sms"
  | "email"
  | "push"
  | "whatsapp"
  | "note"
  | "reminder"
  | "ai";

export type CommunicationDirection = "outbound" | "inbound" | "internal";

export type CommunicationStatus =
  | "logged"
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "skipped"
  | "cancelled";

export type FollowUpStatus = "pending" | "completed" | "cancelled";

export type CommunicationRecord = {
  id: string;
  businessId: string;
  customerId: string;
  appointmentId: string | null;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  subject: string | null;
  body: string | null;
  recipient: string | null;
  provider: string | null;
  providerMessageId: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
};

export type FollowUpReminder = {
  id: string;
  businessId: string;
  customerId: string;
  appointmentId: string | null;
  title: string;
  body: string | null;
  dueAt: string;
  status: FollowUpStatus;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LogCommunicationInput = {
  businessId: string;
  customerId: string;
  appointmentId?: string | null;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status?: CommunicationStatus;
  subject?: string | null;
  body?: string | null;
  recipient?: string | null;
  provider?: string | null;
  providerMessageId?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
};

export type SendMessageInput = {
  businessId: string;
  customerId: string;
  appointmentId?: string | null;
  to: string;
  subject?: string;
  body: string;
  createdBy?: string | null;
};

export type ChannelSendResult = {
  success: boolean;
  status: CommunicationStatus;
  provider: string;
  providerMessageId?: string;
  error?: string;
  skipped?: boolean;
  /** Deep-link URL for client-side channels (tel:, sms:, mailto:). */
  deepLink?: string;
};

/** Pluggable channel adapters (Twilio, Resend, push, WhatsApp, AI, …). */
export interface CommunicationChannelAdapter {
  readonly channel: CommunicationChannel;
  readonly providerName: string;
  send(input: SendMessageInput): Promise<ChannelSendResult>;
}

export type CustomerCommunicationBundle = {
  history: CommunicationRecord[];
  followUps: FollowUpReminder[];
  emailHistory: CommunicationRecord[];
  smsHistory: CommunicationRecord[];
  reminderHistory: CommunicationRecord[];
  notes: CommunicationRecord[];
};
