import {
  AiChannelAdapter,
  CallChannelAdapter,
  EmailChannelAdapter,
  PushChannelAdapter,
  SmsChannelAdapter,
  WhatsAppChannelAdapter,
} from "@/lib/communication/channels";
import type {
  CommunicationChannel,
  CommunicationChannelAdapter,
  CommunicationRecord,
  CustomerCommunicationBundle,
  FollowUpReminder,
  FollowUpStatus,
  LogCommunicationInput,
  SendMessageInput,
} from "@/lib/communication/types";
import { createClient } from "@/lib/supabase/server";

function mapHistory(row: Record<string, unknown>): CommunicationRecord {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    customerId: String(row.customer_id),
    appointmentId: (row.appointment_id as string) ?? null,
    channel: row.channel as CommunicationRecord["channel"],
    direction: row.direction as CommunicationRecord["direction"],
    status: row.status as CommunicationRecord["status"],
    subject: (row.subject as string) ?? null,
    body: (row.body as string) ?? null,
    recipient: (row.recipient as string) ?? null,
    provider: (row.provider as string) ?? null,
    providerMessageId: (row.provider_message_id as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdBy: (row.created_by as string) ?? null,
    createdAt: String(row.created_at),
  };
}

function mapFollowUp(row: Record<string, unknown>): FollowUpReminder {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    customerId: String(row.customer_id),
    appointmentId: (row.appointment_id as string) ?? null,
    title: String(row.title),
    body: (row.body as string) ?? null,
    dueAt: String(row.due_at),
    status: row.status as FollowUpStatus,
    completedAt: (row.completed_at as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * Communication service — single entry point for Call / SMS / Email / notes /
 * reminders. Channel adapters are swappable (Twilio, Resend, push, WhatsApp, AI).
 */
export class CommunicationService {
  private adapters: Map<CommunicationChannel, CommunicationChannelAdapter>;

  constructor(adapters?: CommunicationChannelAdapter[]) {
    const list =
      adapters ??
      ([
        new CallChannelAdapter(),
        new SmsChannelAdapter(),
        new EmailChannelAdapter(),
        new PushChannelAdapter(),
        new WhatsAppChannelAdapter(),
        new AiChannelAdapter(),
      ] satisfies CommunicationChannelAdapter[]);

    this.adapters = new Map(list.map((adapter) => [adapter.channel, adapter]));
  }

  getAdapter(channel: CommunicationChannel): CommunicationChannelAdapter | null {
    return this.adapters.get(channel) ?? null;
  }

  async log(input: LogCommunicationInput): Promise<CommunicationRecord | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("communication_history")
      .insert({
        business_id: input.businessId,
        customer_id: input.customerId,
        appointment_id: input.appointmentId ?? null,
        channel: input.channel,
        direction: input.direction,
        status: input.status ?? "logged",
        subject: input.subject ?? null,
        body: input.body ?? null,
        recipient: input.recipient ?? null,
        provider: input.provider ?? null,
        provider_message_id: input.providerMessageId ?? null,
        metadata: input.metadata ?? {},
        created_by: input.createdBy ?? null,
      })
      .select("*")
      .single();

    if (error) {
      // Migration not applied yet — fail soft so UI still works.
      console.error("[communication] log failed:", error.message);
      return null;
    }
    return mapHistory(data as Record<string, unknown>);
  }

  async sendAndLog(
    channel: "call" | "sms" | "email" | "push" | "whatsapp" | "ai",
    input: SendMessageInput,
  ) {
    const adapter = this.getAdapter(channel);
    if (!adapter) {
      return {
        success: false as const,
        error: `No adapter registered for ${channel}.`,
        record: null,
        deepLink: undefined as string | undefined,
      };
    }

    const result = await adapter.send(input);
    const record = await this.log({
      businessId: input.businessId,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      channel,
      direction: "outbound",
      status: result.status,
      subject: input.subject ?? null,
      body: input.body,
      recipient: input.to,
      provider: result.provider,
      providerMessageId: result.providerMessageId ?? null,
      createdBy: input.createdBy ?? null,
      metadata: {
        skipped: Boolean(result.skipped),
        error: result.error ?? null,
      },
    });

    return {
      success: result.success,
      error: result.error,
      skipped: result.skipped,
      deepLink: result.deepLink,
      record,
    };
  }

  async listForCustomer(
    businessId: string,
    customerId: string,
  ): Promise<CustomerCommunicationBundle> {
    const empty: CustomerCommunicationBundle = {
      history: [],
      followUps: [],
      emailHistory: [],
      smsHistory: [],
      reminderHistory: [],
      notes: [],
    };

    const supabase = await createClient();
    const { data: historyRows, error: historyError } = await supabase
      .from("communication_history")
      .select("*")
      .eq("business_id", businessId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (historyError) {
      console.error("[communication] list history:", historyError.message);
      return empty;
    }

    const history = (historyRows ?? []).map((row) =>
      mapHistory(row as Record<string, unknown>),
    );

    const { data: followRows, error: followError } = await supabase
      .from("communication_follow_ups")
      .select("*")
      .eq("business_id", businessId)
      .eq("customer_id", customerId)
      .order("due_at", { ascending: true });

    if (followError) {
      console.error("[communication] list follow-ups:", followError.message);
    }

    const followUps = (followRows ?? []).map((row) =>
      mapFollowUp(row as Record<string, unknown>),
    );

    return {
      history,
      followUps,
      emailHistory: history.filter((item) => item.channel === "email"),
      smsHistory: history.filter((item) => item.channel === "sms"),
      reminderHistory: history.filter((item) => item.channel === "reminder"),
      notes: history.filter((item) => item.channel === "note"),
    };
  }

  async createFollowUp(input: {
    businessId: string;
    customerId: string;
    appointmentId?: string | null;
    title: string;
    body?: string | null;
    dueAt: string;
    createdBy?: string | null;
  }): Promise<FollowUpReminder | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("communication_follow_ups")
      .insert({
        business_id: input.businessId,
        customer_id: input.customerId,
        appointment_id: input.appointmentId ?? null,
        title: input.title,
        body: input.body ?? null,
        due_at: input.dueAt,
        created_by: input.createdBy ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[communication] create follow-up:", error.message);
      return null;
    }

    await this.log({
      businessId: input.businessId,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      channel: "reminder",
      direction: "internal",
      status: "logged",
      subject: input.title,
      body: input.body ?? null,
      provider: "follow_up",
      createdBy: input.createdBy ?? null,
      metadata: { due_at: input.dueAt, follow_up_id: data.id },
    });

    return mapFollowUp(data as Record<string, unknown>);
  }

  async updateFollowUpStatus(
    businessId: string,
    followUpId: string,
    status: FollowUpStatus,
  ): Promise<FollowUpReminder | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("communication_follow_ups")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", followUpId)
      .eq("business_id", businessId)
      .select("*")
      .single();

    if (error) {
      console.error("[communication] update follow-up:", error.message);
      return null;
    }
    return mapFollowUp(data as Record<string, unknown>);
  }
}

let singleton: CommunicationService | null = null;

export function getCommunicationService(): CommunicationService {
  if (!singleton) singleton = new CommunicationService();
  return singleton;
}
