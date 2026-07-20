/**
 * Provider abstraction — never import Resend/Twilio from business logic.
 * Implementations live behind this interface; current adapters wrap existing providers.
 */

import {
  getEmailProvider as getIntegrationEmailProvider,
  sendEmail as integrationSendEmail,
} from "@/lib/integrations/providers/email";
import {
  getSmsProvider as getIntegrationSmsProvider,
  sendSms as integrationSendSms,
} from "@/lib/integrations/providers/sms";
import type {
  EmailPayload,
  EmailResult,
  SmsPayload,
  SmsResult,
} from "@/lib/integrations/providers/types";

export interface CommunicationsEmailProvider {
  readonly name: string;
  send(payload: EmailPayload): Promise<EmailResult>;
}

export interface CommunicationsSmsProvider {
  readonly name: string;
  send(payload: SmsPayload): Promise<SmsResult>;
}

class IntegrationEmailAdapter implements CommunicationsEmailProvider {
  get name() {
    return getIntegrationEmailProvider().name;
  }
  send(payload: EmailPayload) {
    return integrationSendEmail(payload);
  }
}

class IntegrationSmsAdapter implements CommunicationsSmsProvider {
  get name() {
    return getIntegrationSmsProvider().name;
  }
  send(payload: SmsPayload) {
    return integrationSendSms(payload);
  }
}

const emailProvider: CommunicationsEmailProvider = new IntegrationEmailAdapter();
const smsProvider: CommunicationsSmsProvider = new IntegrationSmsAdapter();

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
