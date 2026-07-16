import { getAlexAvailabilityRecommendations } from "@/lib/ai-workforce/alex";
import { detectReceptionistIntent } from "@/lib/ai-receptionist/intents";
import { loadBusinessKnowledge } from "@/lib/ai-receptionist/knowledge";
import { getReceptionistProvider } from "@/lib/ai-receptionist/providers";
import type {
  ReceptionistChannel,
  ReceptionistConversation,
  ReceptionistMessage,
  ReceptionistTurnResult,
  SuggestedSlot,
} from "@/lib/ai-receptionist/types";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { getCommunicationService } from "@/lib/communication";
import { getAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { addHours } from "date-fns";

function mapConversation(row: Record<string, unknown>): ReceptionistConversation {
  return {
    id: String(row.id),
    business_id: String(row.business_id),
    location_id: (row.location_id as string) ?? null,
    customer_id: (row.customer_id as string) ?? null,
    channel: row.channel as ReceptionistChannel,
    status: row.status as ReceptionistConversation["status"],
    visitor_name: (row.visitor_name as string) ?? null,
    visitor_email: (row.visitor_email as string) ?? null,
    visitor_phone: (row.visitor_phone as string) ?? null,
    intent: (row.intent as string) ?? null,
    booking_started: Boolean(row.booking_started),
    escalated_at: (row.escalated_at as string) ?? null,
    escalation_reason: (row.escalation_reason as string) ?? null,
    follow_up_id: (row.follow_up_id as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapMessage(row: Record<string, unknown>): ReceptionistMessage {
  return {
    id: String(row.id),
    business_id: String(row.business_id),
    conversation_id: String(row.conversation_id),
    role: row.role as ReceptionistMessage["role"],
    content: String(row.content),
    intent: (row.intent as string) ?? null,
    provider: (row.provider as string) ?? null,
    citations: (row.citations as ReceptionistMessage["citations"]) ?? [],
    suggested_slots:
      (row.suggested_slots as ReceptionistMessage["suggested_slots"]) ?? [],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: String(row.created_at),
  };
}

async function resolveCustomerId(
  businessId: string,
  email: string | null | undefined,
): Promise<string | null> {
  if (!email) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("business_id", businessId)
    .ilike("email", email.trim())
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

async function loadSuggestedSlots(): Promise<SuggestedSlot[]> {
  const { recommendations } = await getAlexAvailabilityRecommendations({
    daysAhead: 5,
  });
  const slots: SuggestedSlot[] = [];
  for (const rec of recommendations) {
    for (const iso of rec.slots.slice(0, 3)) {
      slots.push({
        date: rec.date,
        timeLabel: formatTime(parseISO(iso)),
        startIso: iso,
        staffId: rec.staffId,
        staffName: rec.staffName,
        serviceId: rec.serviceId,
        serviceName: rec.serviceName,
      });
    }
  }
  return slots.slice(0, 8);
}

export class AiReceptionistService {
  async listConversations(
    businessId: string,
    limit = 20,
  ): Promise<ReceptionistConversation[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ai_receptionist_conversations")
      .select("*")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[ai-receptionist] list conversations:", error.message);
      return [];
    }
    return (data ?? []).map((row) =>
      mapConversation(row as Record<string, unknown>),
    );
  }

  async getMessages(conversationId: string): Promise<ReceptionistMessage[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ai_receptionist_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at");

    if (error) {
      console.error("[ai-receptionist] list messages:", error.message);
      return [];
    }
    return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
  }

  async ensureConversation(input: {
    businessId: string;
    locationId?: string | null;
    conversationId?: string | null;
    channel?: ReceptionistChannel;
    visitorName?: string | null;
    visitorEmail?: string | null;
    visitorPhone?: string | null;
    customerId?: string | null;
  }): Promise<ReceptionistConversation | null> {
    const supabase = await createClient();

    if (input.conversationId) {
      const { data } = await supabase
        .from("ai_receptionist_conversations")
        .select("*")
        .eq("id", input.conversationId)
        .eq("business_id", input.businessId)
        .maybeSingle();
      if (data) return mapConversation(data as Record<string, unknown>);
    }

    const customerId =
      input.customerId ??
      (await resolveCustomerId(input.businessId, input.visitorEmail));

    const { data, error } = await supabase
      .from("ai_receptionist_conversations")
      .insert({
        business_id: input.businessId,
        location_id: input.locationId ?? null,
        customer_id: customerId,
        channel: input.channel ?? "web",
        visitor_name: input.visitorName ?? null,
        visitor_email: input.visitorEmail ?? null,
        visitor_phone: input.visitorPhone ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[ai-receptionist] create conversation:", error.message);
      return null;
    }
    return mapConversation(data as Record<string, unknown>);
  }

  async handleTurn(input: {
    businessId: string;
    locationId?: string | null;
    conversationId?: string | null;
    message: string;
    channel?: ReceptionistChannel;
    visitorName?: string | null;
    visitorEmail?: string | null;
    visitorPhone?: string | null;
    customerId?: string | null;
  }): Promise<ReceptionistTurnResult> {
    const message = input.message.trim();
    if (!message) {
      return {
        conversationId: input.conversationId ?? "",
        reply: "Please send a message so I can help.",
        intent: "general",
        provider: "emma_grounded",
        citations: [],
        suggestedSlots: [],
        bookingUrl: null,
        escalated: false,
        followUpCreated: false,
        loggedToCrm: false,
      };
    }

    const knowledge = await loadBusinessKnowledge({
      locationId: input.locationId,
    });
    const intent = detectReceptionistIntent(message);
    const needsSlots = intent === "availability" || intent === "booking";
    const suggestedSlots = needsSlots ? await loadSuggestedSlots() : [];

    const conversation = await this.ensureConversation({
      businessId: input.businessId,
      locationId: input.locationId,
      conversationId: input.conversationId,
      channel: input.channel,
      visitorName: input.visitorName,
      visitorEmail: input.visitorEmail,
      visitorPhone: input.visitorPhone,
      customerId: input.customerId,
    });

    // Soft path when migration 022 not applied yet
    if (!conversation) {
      const provider = getReceptionistProvider();
      const result = await provider.complete({
        message,
        intent,
        knowledge,
        suggestedSlots,
        history: [],
      });
      return {
        conversationId: "",
        reply: `${result.reply}\n\n(Conversation history will persist after migration 022_ai_receptionist is applied.)`,
        intent,
        provider: result.provider,
        citations: result.citations,
        suggestedSlots,
        bookingUrl:
          intent === "booking" || needsSlots ? knowledge.bookingUrl : null,
        escalated: result.escalate,
        followUpCreated: false,
        loggedToCrm: false,
      };
    }

    const supabase = await createClient();
    const prior = await this.getMessages(conversation.id);

    await supabase.from("ai_receptionist_messages").insert({
      business_id: input.businessId,
      conversation_id: conversation.id,
      role: "user",
      content: message,
      intent,
    });

    let providerResult;
    try {
      providerResult = await getReceptionistProvider().complete({
        message,
        intent,
        knowledge,
        suggestedSlots,
        history: prior
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
      });
    } catch (err) {
      console.error("[ai-receptionist] provider failed:", err);
      const grounded = await import("@/lib/ai-receptionist/providers/grounded");
      providerResult = await new grounded.GroundedReceptionistProvider().complete(
        {
          message,
          intent,
          knowledge,
          suggestedSlots,
          history: [],
        },
      );
    }

    const bookingStarted = intent === "booking" || needsSlots;
    const escalated = providerResult.escalate || intent === "escalate";

    await supabase.from("ai_receptionist_messages").insert({
      business_id: input.businessId,
      conversation_id: conversation.id,
      role: "assistant",
      content: providerResult.reply,
      intent,
      provider: providerResult.provider,
      citations: providerResult.citations,
      suggested_slots: suggestedSlots,
      metadata: {
        bookingUrl: knowledge.bookingUrl,
        escalated,
      },
    });

    const updates: Record<string, unknown> = {
      intent,
      booking_started: conversation.booking_started || bookingStarted,
      updated_at: new Date().toISOString(),
    };

    let followUpCreated = false;
    let loggedToCrm = false;
    let followUpId = conversation.follow_up_id;

    if (escalated && conversation.status !== "escalated") {
      updates.status = "escalated";
      updates.escalated_at = new Date().toISOString();
      updates.escalation_reason = message.slice(0, 500);

      if (conversation.customer_id) {
        const dueAt = addHours(new Date(), 4).toISOString();
        const followUp = await getCommunicationService().createFollowUp({
          businessId: input.businessId,
          customerId: conversation.customer_id,
          title: "Emma escalation — staff follow-up",
          body: `Visitor asked: ${message.slice(0, 400)}`,
          dueAt,
        });
        if (followUp) {
          followUpCreated = true;
          followUpId = followUp.id;
          updates.follow_up_id = followUp.id;
        }

        await getCommunicationService().log({
          businessId: input.businessId,
          customerId: conversation.customer_id,
          channel: "ai",
          direction: "internal",
          status: "logged",
          subject: "AI Receptionist escalation",
          body: providerResult.reply,
          provider: providerResult.provider,
          metadata: {
            conversationId: conversation.id,
            intent,
            agent: "emma",
          },
        });
        loggedToCrm = true;

        await supabase.from("customer_notes").insert({
          business_id: input.businessId,
          customer_id: conversation.customer_id,
          body: `[Emma] Escalation: ${message.slice(0, 300)}`,
          is_pinned: false,
          is_private: false,
        });
      }
    } else if (conversation.customer_id && (bookingStarted || intent === "general")) {
      await getCommunicationService().log({
        businessId: input.businessId,
        customerId: conversation.customer_id,
        channel: "ai",
        direction: "outbound",
        status: "logged",
        subject: "AI Receptionist conversation",
        body: `User: ${message}\n\nEmma: ${providerResult.reply}`,
        provider: providerResult.provider,
        metadata: {
          conversationId: conversation.id,
          intent,
          agent: "emma",
          channelPrep: "voice_reserved",
        },
      });
      loggedToCrm = true;
    }

    await supabase
      .from("ai_receptionist_conversations")
      .update(updates)
      .eq("id", conversation.id)
      .eq("business_id", input.businessId);

    void followUpId;

    return {
      conversationId: conversation.id,
      reply: providerResult.reply,
      intent,
      provider: providerResult.provider,
      citations: providerResult.citations,
      suggestedSlots,
      bookingUrl: bookingStarted ? knowledge.bookingUrl : null,
      escalated,
      followUpCreated,
      loggedToCrm,
    };
  }
}

let service: AiReceptionistService | null = null;

export function getAiReceptionistService(): AiReceptionistService {
  if (!service) service = new AiReceptionistService();
  return service;
}

export function publicBookingPath(slug: string) {
  return `${getAppUrl()}/book/${slug}`;
}
