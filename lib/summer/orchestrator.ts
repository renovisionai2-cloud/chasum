/**
 * Summer orchestrator — professional receptionist turns.
 * Grounded answers from Business / Services / Employees / CRM.
 * Slots and mutations only via Booking + Availability engines.
 */

import { getAiReceptionistService } from "@/lib/ai-receptionist/service";
import type { ReceptionistCitation } from "@/lib/ai-receptionist/types";
import { parseAiSettings } from "@/lib/business/settings";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { getCommunicationService } from "@/lib/communication";
import { createClient } from "@/lib/supabase/server";
import { addHours, format } from "date-fns";
import {
  detectSummerIntent,
  matchServiceFromMessage,
  matchStaffFromMessage,
} from "@/lib/summer/intents";
import {
  summerLoadKnowledge,
  summerLookupCustomer,
  summerPreviewForService,
  upcomingToCards,
} from "@/lib/summer/tools";
import type {
  SummerIntent,
  SummerSessionContext,
  SummerTurnResult,
} from "@/lib/summer/types";

function emptyResult(
  partial: Partial<SummerTurnResult> &
    Pick<SummerTurnResult, "conversationId" | "reply" | "intent">,
): SummerTurnResult {
  return {
    provider: "summer_grounded",
    citations: [],
    bookingOptions: [],
    appointmentCards: [],
    confirmation: null,
    conflicts: [],
    escalated: false,
    escalationReason: null,
    followUpCreated: false,
    loggedToCrm: false,
    customerRecognized: false,
    customerDisplayName: null,
    customerId: null,
    suggestions: [],
    ...partial,
  };
}

function defaultSuggestions(intent: SummerIntent): string[] {
  switch (intent) {
    case "booking":
    case "availability":
      return [
        "Show haircut availability",
        "Book with my preferred employee",
        "What services do you offer?",
      ];
    case "cancel":
      return ["Show my upcoming appointments", "I need to speak with staff"];
    case "reschedule":
      return ["Show my upcoming appointments", "Find another time this week"];
    default:
      return [
        "What are your hours?",
        "What services do you offer?",
        "When is the next available appointment?",
        "I'd like to book",
        "I need to speak with staff",
      ];
  }
}

export async function handleSummerTurn(
  input: SummerSessionContext & { message: string },
): Promise<SummerTurnResult> {
  const message = input.message.trim();
  if (!message) {
    return emptyResult({
      conversationId: input.conversationId ?? "",
      reply: "How can I help you today?",
      intent: "general",
      suggestions: defaultSuggestions("general"),
    });
  }

  const knowledge = await summerLoadKnowledge(input.locationId);
  const supabase = await createClient();
  const { data: businessRow } = await supabase
    .from("businesses")
    .select("ai_settings")
    .eq("id", input.businessId)
    .maybeSingle();
  const summerCfg = parseAiSettings(businessRow?.ai_settings).summer;

  const customerSnap = await summerLookupCustomer({
    businessId: input.businessId,
    email: input.visitorEmail,
    phone: input.visitorPhone,
    customerId: input.customerId,
  });

  const intent = detectSummerIntent(message);
  const locationId =
    input.locationId ??
    knowledge.locations.find((l) => l.isDefault)?.id ??
    knowledge.locations[0]?.id ??
    "";

  const conversation = await getAiReceptionistService().ensureConversation({
    businessId: input.businessId,
    locationId: input.locationId,
    conversationId: input.conversationId,
    channel: "internal",
    visitorName: input.visitorName ?? customerSnap?.displayName ?? null,
    visitorEmail: input.visitorEmail,
    visitorPhone: input.visitorPhone,
    customerId: customerSnap?.customerId ?? input.customerId,
  });

  const conversationId = conversation?.id ?? input.conversationId ?? "";

  const citations: ReceptionistCitation[] = [];
  let reply = "";
  let bookingOptions = [] as SummerTurnResult["bookingOptions"];
  let appointmentCards = [] as SummerTurnResult["appointmentCards"];
  let conflicts = [] as SummerTurnResult["conflicts"];
  let escalated = intent === "escalate";
  let escalationReason: string | null = null;

  const toneLead =
    summerCfg.greeting?.trim() ||
    `Hi — I'm Summer, the AI receptionist for ${knowledge.businessName}.`;

  if (intent === "escalate") {
    escalationReason = message.slice(0, 400);
    reply = summerCfg.escalation?.trim()
      ? summerCfg.escalation.trim()
      : `I'll connect you with the ${knowledge.businessName} team. I've flagged this for staff follow-up${
          knowledge.phone ? ` — you can also call ${knowledge.phone}` : ""
        }.`;
  } else if (intent === "greeting") {
    reply = `${toneLead} I can book, reschedule, or cancel appointments, answer hours and services, and look up returning guests — always from your Chasum data, never invented times or prices.`;
    if (customerSnap) {
      reply += ` Welcome back, ${customerSnap.preferredName ?? customerSnap.displayName}.`;
    }
  } else if (intent === "hours") {
    citations.push({ source: "hours", label: "Business hours" });
    const lines = knowledge.hours.length
      ? knowledge.hours
          .map((h) =>
            h.isOpen
              ? `• ${h.dayLabel}: ${h.openTime}–${h.closeTime}`
              : `• ${h.dayLabel}: closed`,
          )
          .join("\n")
      : "Hours are not configured yet — I'll escalate to staff.";
    if (!knowledge.hours.length) escalated = true;
    reply = `Here are ${knowledge.businessName}'s hours (${knowledge.timezone}):\n${lines}`;
  } else if (intent === "services") {
    citations.push({ source: "services", label: "Services catalog" });
    if (!knowledge.services.length) {
      escalated = true;
      reply =
        "I don't see active services configured. Escalating so the team can help.";
    } else {
      reply =
        `Services at ${knowledge.businessName}:\n` +
        knowledge.services
          .slice(0, 12)
          .map(
            (s) =>
              `• ${s.name} — ${s.durationMinutes} min · $${Number(s.price).toFixed(2)}`,
          )
          .join("\n") +
        "\n\nSay a service name and I will check real availability.";
    }
  } else if (intent === "employees") {
    citations.push({ source: "staff", label: "Employees" });
    reply = knowledge.employees.length
      ? `Team members:\n${knowledge.employees
          .map((e) => `• ${e.name}${e.title ? ` — ${e.title}` : ""}`)
          .join("\n")}`
      : "No active employees listed for this location yet.";
    if (customerSnap?.preferredEmployeeName) {
      reply += `\n\nYour preferred employee on file: ${customerSnap.preferredEmployeeName}.`;
    }
  } else if (intent === "locations") {
    citations.push({ source: "locations", label: "Locations" });
    reply = knowledge.locations.length
      ? knowledge.locations
          .map(
            (l) =>
              `• ${l.name}${l.address ? ` — ${l.address}` : ""}${
                l.phone ? ` · ${l.phone}` : ""
              }`,
          )
          .join("\n")
      : knowledge.address
        ? knowledge.address
        : "Location details are not configured yet.";
  } else if (intent === "policy") {
    citations.push({ source: "policy", label: "Policies" });
    const parts = [
      knowledge.cancellationPolicy
        ? `Cancellation: ${knowledge.cancellationPolicy}`
        : null,
      knowledge.bookingPolicy ? `Booking: ${knowledge.bookingPolicy}` : null,
      summerCfg.business_knowledge?.trim() || null,
    ].filter(Boolean);
    if (!parts.length) {
      escalated = true;
      reply =
        "I don't have published policies on file. Escalating to staff so we don't invent rules.";
    } else {
      reply = parts.join("\n\n");
    }
  } else if (intent === "customer") {
    if (!customerSnap) {
      reply =
        "I can look up a returning guest once I have their email or phone on this conversation. Add contact details above, then ask again.";
    } else {
      reply = [
        `Recognized: ${customerSnap.displayName}`,
        customerSnap.preferredEmployeeName
          ? `Preferred employee: ${customerSnap.preferredEmployeeName}`
          : null,
        customerSnap.preferredServices.length
          ? `Recent services: ${customerSnap.preferredServices.join(", ")}`
          : null,
        `Lifetime visits: ${customerSnap.lifetimeVisits} · Upcoming: ${customerSnap.upcomingCount}`,
        customerSnap.nextAppointment
          ? `Next visit: ${format(parseISO(customerSnap.nextAppointment), "MMM d, yyyy")} at ${formatTime(parseISO(customerSnap.nextAppointment))}`
          : "No upcoming appointment on file.",
      ]
        .filter(Boolean)
        .join("\n");
      appointmentCards = upcomingToCards(customerSnap.upcomingAppointments);
    }
  } else if (
    intent === "booking" ||
    intent === "availability" ||
    intent === "reschedule"
  ) {
    citations.push({ source: "availability", label: "Availability Engine" });
    citations.push({ source: "services", label: "Services" });

    if (!locationId) {
      escalated = true;
      reply = "No location is configured — I can't check availability safely.";
    } else {
      const matchedService = matchServiceFromMessage(
        message,
        knowledge.services,
      );
      const matchedStaff = matchStaffFromMessage(
        message,
        knowledge.employees,
      );
      const preferredStaffId =
        matchedStaff?.id ??
        (customerSnap?.preferredEmployeeName
          ? knowledge.employees.find(
              (e) => e.name === customerSnap.preferredEmployeeName,
            )?.id
          : null) ??
        null;

      const service =
        matchedService ??
        (customerSnap?.preferredServices[0]
          ? knowledge.services.find(
              (s) => s.name === customerSnap.preferredServices[0],
            )
          : null) ??
        knowledge.services[0] ??
        null;

      if (!service) {
        escalated = true;
        reply =
          "No bookable services are configured. Escalating to staff.";
      } else if (!matchedService && intent === "booking") {
        reply =
          `I can book from your live catalog. Which service?\n` +
          knowledge.services
            .slice(0, 8)
            .map((s) => `• ${s.name} ($${Number(s.price).toFixed(0)})`)
            .join("\n") +
          `\n\nReply with a service name (for example: “Book ${knowledge.services[0]?.name}”).`;
      } else {
        const preview = await summerPreviewForService({
          businessId: input.businessId,
          locationId,
          serviceId: service.id,
          preferredStaffId,
          knowledge,
        });
        bookingOptions = preview.options;
        conflicts = preview.conflicts.map((c) => ({
          code: c.code,
          message: c.message,
        }));

        if (bookingOptions.length === 0) {
          escalated = true;
          escalationReason = "No availability";
          reply = `I checked real availability for ${service.name} and found no open slots in the next few days.`;
          if (conflicts[0]) {
            reply += `\n\nConflict: ${conflicts[0].message}`;
          }
          reply +=
            "\n\nI've flagged this for staff — they can offer alternatives or a waitlist.";
        } else {
          reply =
            intent === "reschedule"
              ? `Here are real openings to move into for ${service.name}. Select a card to confirm — I never invent times.`
              : `Here are live openings for ${service.name}${
                  preferredStaffId
                    ? ` (preferring ${
                        knowledge.employees.find((e) => e.id === preferredStaffId)
                          ?.name ?? "your preferred employee"
                      })`
                    : ""
                }. Select a card to confirm the booking through the Booking Engine.`;
        }
      }
    }

    if (intent === "reschedule" && customerSnap) {
      appointmentCards = upcomingToCards(customerSnap.upcomingAppointments);
      if (appointmentCards.length === 0 && bookingOptions.length > 0) {
        reply +=
          "\n\nI don't see an upcoming appointment to move. Share the appointment ID with staff if needed.";
      }
    }
  } else if (intent === "cancel") {
    if (!customerSnap) {
      reply =
        "To cancel safely I need to recognize the guest (email or phone). Add contact details, then ask again.";
    } else {
      appointmentCards = upcomingToCards(customerSnap.upcomingAppointments);
      if (!appointmentCards.length) {
        reply = `${customerSnap.displayName} has no upcoming appointments on file.`;
      } else {
        reply = `Here are upcoming visits for ${customerSnap.displayName}. Choose one to cancel — cancellation goes through the Booking Engine and your policies.`;
      }
    }
  } else {
    // general — stay grounded, never invent
    const faq = summerCfg.business_knowledge?.trim();
    if (faq && message.length > 8) {
      reply = `I can answer from configured business knowledge:\n\n${faq.slice(0, 600)}\n\nAsk about hours, services, availability, booking, reschedule, or cancel — or say if you'd like a human.`;
    } else {
      reply = `${toneLead} Ask about hours, services, team, availability, booking, reschedule, or cancel. I only use Chasum data and the Booking Engine.`;
    }
  }

  // Persist via receptionist tables when available
  if (conversation) {
    await supabase.from("ai_receptionist_messages").insert([
      {
        business_id: input.businessId,
        conversation_id: conversation.id,
        role: "user",
        content: message,
        intent,
      },
      {
        business_id: input.businessId,
        conversation_id: conversation.id,
        role: "assistant",
        content: reply,
        intent,
        provider: "summer_grounded",
        citations,
        suggested_slots: bookingOptions.map((o) => ({
          date: o.dateLabel,
          timeLabel: o.timeLabel,
          startIso: o.startIso,
          staffId: o.staffId,
          staffName: o.staffName,
          serviceId: o.serviceId,
          serviceName: o.serviceName,
        })),
        metadata: {
          agent: "summer",
          escalated,
          bookingOptionIds: bookingOptions.map((o) => o.id),
        },
      },
    ]);

    const updates: Record<string, unknown> = {
      intent,
      booking_started:
        conversation.booking_started ||
        intent === "booking" ||
        intent === "availability",
      updated_at: new Date().toISOString(),
      customer_id: customerSnap?.customerId ?? conversation.customer_id,
    };

    let followUpCreated = false;
    let loggedToCrm = false;

    if (escalated && conversation.status !== "escalated") {
      updates.status = "escalated";
      updates.escalated_at = new Date().toISOString();
      updates.escalation_reason = escalationReason ?? message.slice(0, 500);

      if (customerSnap?.customerId) {
        const followUp = await getCommunicationService().createFollowUp({
          businessId: input.businessId,
          customerId: customerSnap.customerId,
          title: "Summer escalation — staff follow-up",
          body: `Guest asked: ${message.slice(0, 400)}`,
          dueAt: addHours(new Date(), 4).toISOString(),
        });
        if (followUp) {
          followUpCreated = true;
          updates.follow_up_id = followUp.id;
        }
        await getCommunicationService().log({
          businessId: input.businessId,
          customerId: customerSnap.customerId,
          channel: "ai",
          direction: "internal",
          status: "logged",
          subject: "Summer escalation",
          body: reply,
          provider: "summer_grounded",
          metadata: {
            conversationId: conversation.id,
            intent,
            agent: "summer",
          },
        });
        loggedToCrm = true;
      }
    } else if (customerSnap?.customerId) {
      await getCommunicationService().log({
        businessId: input.businessId,
        customerId: customerSnap.customerId,
        channel: "ai",
        direction: "outbound",
        status: "logged",
        subject: "Summer conversation",
        body: `Guest: ${message}\n\nSummer: ${reply}`,
        provider: "summer_grounded",
        metadata: {
          conversationId: conversation.id,
          intent,
          agent: "summer",
        },
      });
      loggedToCrm = true;
    }

    await supabase
      .from("ai_receptionist_conversations")
      .update(updates)
      .eq("id", conversation.id)
      .eq("business_id", input.businessId);

    return emptyResult({
      conversationId: conversation.id,
      reply,
      intent,
      citations,
      bookingOptions,
      appointmentCards,
      conflicts,
      escalated,
      escalationReason,
      followUpCreated,
      loggedToCrm,
      customerRecognized: Boolean(customerSnap),
      customerDisplayName: customerSnap?.displayName ?? null,
      customerId: customerSnap?.customerId ?? null,
      suggestions: defaultSuggestions(intent),
    });
  }

  return emptyResult({
    conversationId,
    reply:
      reply +
      "\n\n(Conversation history persists after migration 022_ai_receptionist.)",
    intent,
    citations,
    bookingOptions,
    appointmentCards,
    conflicts,
    escalated,
    escalationReason,
    customerRecognized: Boolean(customerSnap),
    customerDisplayName: customerSnap?.displayName ?? null,
    customerId: customerSnap?.customerId ?? null,
    suggestions: defaultSuggestions(intent),
  });
}
