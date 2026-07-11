import { getTwilioConfig } from "@/lib/env";
import type { SmsPayload, SmsProvider, SmsResult } from "./types";

class TwilioSmsProvider implements SmsProvider {
  readonly name = "twilio";

  async send(payload: SmsPayload): Promise<SmsResult> {
    const config = getTwilioConfig();
    if (!config) {
      return { success: false, error: "Twilio is not configured." };
    }

    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString(
      "base64",
    );

    const body = new URLSearchParams({
      To: payload.to,
      From: config.phoneNumber,
      Body: payload.body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    const data = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) {
      return { success: false, error: data.message ?? "Failed to send SMS." };
    }
    return { success: true, messageId: data.sid };
  }
}

class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";

  async send(payload: SmsPayload): Promise<SmsResult> {
    console.info("[sms]", payload.to, payload.body);
    return { success: true, messageId: `console-sms-${Date.now()}` };
  }
}

let smsProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (!smsProvider) {
    smsProvider = getTwilioConfig()
      ? new TwilioSmsProvider()
      : new ConsoleSmsProvider();
  }
  return smsProvider;
}

export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  return getSmsProvider().send(payload);
}
