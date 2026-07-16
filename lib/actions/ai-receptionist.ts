"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import { getAiReceptionistService } from "@/lib/ai-receptionist/service";
import type {
  ReceptionistConversation,
  ReceptionistMessage,
  ReceptionistTurnResult,
} from "@/lib/ai-receptionist/types";
import { loadBusinessKnowledge } from "@/lib/ai-receptionist/knowledge";
import { revalidatePath } from "next/cache";

function revalidateReceptionist() {
  revalidatePath("/dashboard/ai-workforce");
  revalidatePath("/dashboard/ai-workforce/emma");
  revalidatePath("/dashboard/ai-workforce/command");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/reports");
}

export async function sendReceptionistMessage(input: {
  message: string;
  conversationId?: string | null;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
  customerId?: string | null;
}): Promise<ReceptionistTurnResult> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const result = await getAiReceptionistService().handleTurn({
    businessId: business.id,
    locationId,
    conversationId: input.conversationId,
    message: input.message,
    channel: "internal",
    visitorName: input.visitorName,
    visitorEmail: input.visitorEmail,
    visitorPhone: input.visitorPhone,
    customerId: input.customerId,
  });
  revalidateReceptionist();
  return result;
}

export async function listReceptionistConversations(): Promise<
  ReceptionistConversation[]
> {
  const business = await getOrCreateBusiness();
  return getAiReceptionistService().listConversations(business.id);
}

export async function getReceptionistMessages(
  conversationId: string,
): Promise<ReceptionistMessage[]> {
  return getAiReceptionistService().getMessages(conversationId);
}

export async function getReceptionistKnowledgeSummary(): Promise<{
  businessName: string;
  serviceCount: number;
  employeeCount: number;
  locationCount: number;
  hoursConfigured: number;
  bookingUrl: string;
  providerReady: boolean;
  providerName: string;
}> {
  const knowledge = await loadBusinessKnowledge();
  const { getReceptionistProvider } = await import(
    "@/lib/ai-receptionist/providers"
  );
  const provider = getReceptionistProvider();
  return {
    businessName: knowledge.businessName,
    serviceCount: knowledge.services.length,
    employeeCount: knowledge.employees.length,
    locationCount: knowledge.locations.length,
    hoursConfigured: knowledge.hours.filter((h) => h.isOpen).length,
    bookingUrl: knowledge.bookingUrl,
    providerReady: provider.ready,
    providerName: provider.name,
  };
}
