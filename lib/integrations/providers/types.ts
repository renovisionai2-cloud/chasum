export type EmailAttachment = {
  filename: string;
  content: string; // base64
  contentType?: string;
};

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

export type EmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export interface EmailProvider {
  readonly name: string;
  send(payload: EmailPayload): Promise<EmailResult>;
}

export type SmsPayload = {
  to: string;
  body: string;
};

export type SmsResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  /** True when the channel is intentionally disabled (e.g. no Twilio in production). */
  skipped?: boolean;
};

export interface SmsProvider {
  readonly name: string;
  send(payload: SmsPayload): Promise<SmsResult>;
}

export type CalendarEventPayload = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  location?: string;
};

export type CalendarEventResult = {
  externalEventId: string;
  raw?: unknown;
};

export interface CalendarProviderAdapter {
  readonly provider: "google" | "outlook" | "apple";
  listEvents(
    accessToken: string,
    calendarId: string,
    start: string,
    end: string,
    syncToken?: string | null,
  ): Promise<{
    events: Array<{
      id: string;
      title: string;
      start: string;
      end: string;
      isBusy: boolean;
      raw?: unknown;
    }>;
    nextSyncToken?: string;
  }>;
  createEvent(
    accessToken: string,
    calendarId: string,
    event: CalendarEventPayload,
  ): Promise<CalendarEventResult>;
  updateEvent(
    accessToken: string,
    calendarId: string,
    externalEventId: string,
    event: CalendarEventPayload,
  ): Promise<void>;
  deleteEvent(
    accessToken: string,
    calendarId: string,
    externalEventId: string,
  ): Promise<void>;
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: Date;
    refreshToken?: string;
  }>;
}
