/**
 * Provider abstraction — never import Resend/Twilio from business logic.
 * Implementations live behind this interface; current adapters wrap existing providers.
 */

import {
  sendEmail as integrationSendEmail,
} from "@/lib/integrations/providers/email";
import {
  sendSms as integrationSendSms,
} from "@/lib/integrations/providers/sms";
import type {
  EmailPayload,
  EmailResult,
  SmsPayload,
  SmsResult,
} from "@/lib/integrations/providers/types";

export interface CommunicationsEmailProvider {
  readonly name: "resend" | "console" | "disabled" | "other";
  send(payload: EmailPayload): Promise<EmailResult>;
}

export interface CommunicationsSmsProvider {
  readonly name: "twilio" | "console" | "disabled" | "other";
  send(payload: SmsPayload): Promise<SmsResult>;
}

class ResendAdapter implements CommunicationsEmailProvider {
  readonly name = "resend" as const;
  send(payload: EmailPayload) {
    return integrationSendEmail(payload);
  }
}

class TwilioAdapter implements CommunicationsSmsProvider {
  readonly name = "twilio" as const;
  send(payload: SmsPayload) {
    return integrationSendSms(payload);
  }
}

/** Future providers register here (SendGrid, MessageBird, etc.). */
const emailProvider: CommunicationsEmailProvider = new ResendAdapter();
const smsProvider: CommunicationsSmsProvider = new TwilioAdapter();

export function getEmailProvider(): CommunicationsEmailProvider {
  return emailProvider;
}

export function getSmsProvider(): CommunicationsSmsProvider {
  return smsProvider;
}

export async function providerSendEmail(
  payload: EmailPayload,
): Promise<EmailResult & { provider: string }> {
  const provider = getEmailProvider();
  const result = await provider.send(payload);
  return { ...result, provider: provider.name };
}

export async function providerSendSms(
  payload: SmsPayload,
): Promise<SmsResult & { provider: string }> {
  const provider = getSmsProvider();
  const result = await provider.send(payload);
  return { ...result, provider: provider.name };
}
