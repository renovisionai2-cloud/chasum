import type {
  ChannelSendResult,
  CommunicationChannelAdapter,
  SendMessageInput,
} from "@/lib/communication/types";
import { sendEmail } from "@/lib/integrations/providers/email";
import { sendSms } from "@/lib/integrations/providers/sms";

function encodeBody(body: string) {
  return encodeURIComponent(body);
}

/** Native dialer — logs as initiated; Twilio Voice can replace later. */
export class CallChannelAdapter implements CommunicationChannelAdapter {
  readonly channel = "call" as const;
  readonly providerName = "tel_link";

  async send(input: SendMessageInput): Promise<ChannelSendResult> {
    const phone = input.to.trim();
    if (!phone) {
      return {
        success: false,
        status: "failed",
        provider: this.providerName,
        error: "No phone number on file.",
      };
    }
    return {
      success: true,
      status: "logged",
      provider: this.providerName,
      deepLink: `tel:${phone.replace(/[^\d+]/g, "")}`,
    };
  }
}

/** SMS via Twilio (or console/disabled). Also exposes sms: deep link fallback. */
export class SmsChannelAdapter implements CommunicationChannelAdapter {
  readonly channel = "sms" as const;
  readonly providerName = "twilio";

  async send(input: SendMessageInput): Promise<ChannelSendResult> {
    const phone = input.to.trim();
    if (!phone) {
      return {
        success: false,
        status: "failed",
        provider: this.providerName,
        error: "No phone number on file.",
      };
    }

    const result = await sendSms({ to: phone, body: input.body });
    const deepLink = `sms:${phone.replace(/[^\d+]/g, "")}?body=${encodeBody(input.body)}`;
    const { getSmsProvider } = await import("@/lib/integrations/providers/sms");
    const providerName = getSmsProvider().name;

    if (result.skipped) {
      return {
        success: false,
        status: "skipped",
        provider: providerName,
        skipped: true,
        deepLink,
        error:
          result.error ??
          "SMS was not sent. The messaging provider is unavailable.",
      };
    }

    if (!result.success) {
      return {
        success: false,
        status: "failed",
        provider: providerName,
        error: result.error ?? "Failed to send SMS.",
        deepLink,
      };
    }

    return {
      success: true,
      status: "sent",
      provider: providerName,
      providerMessageId: result.messageId,
      deepLink,
    };
  }
}

/** Email via Resend (or console/disabled). mailto: as client fallback. */
export class EmailChannelAdapter implements CommunicationChannelAdapter {
  readonly channel = "email" as const;
  readonly providerName = "resend";

  async send(input: SendMessageInput): Promise<ChannelSendResult> {
    const email = input.to.trim();
    if (!email) {
      return {
        success: false,
        status: "failed",
        provider: this.providerName,
        error: "No email on file.",
      };
    }

    const subject = input.subject?.trim() || "Message from your provider";
    const html = `<p>${input.body.replace(/\n/g, "<br/>")}</p>`;
    const { getEmailProvider } = await import(
      "@/lib/integrations/providers/email"
    );
    const providerName = getEmailProvider().name;
    const result = await sendEmail({
      to: email,
      subject,
      html,
      text: input.body,
    });

    const deepLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeBody(input.body)}`;

    if (!result.success) {
      return {
        success: false,
        status: "failed",
        provider: providerName,
        error: result.error ?? "Failed to send email.",
        deepLink,
      };
    }

    if (providerName === "console") {
      return {
        success: false,
        status: "skipped",
        provider: providerName,
        skipped: true,
        deepLink,
        error:
          "Email was only logged locally (dev console). It was not delivered to the customer. Configure RESEND_API_KEY for real delivery.",
      };
    }

    return {
      success: true,
      status: "sent",
      provider: providerName,
      providerMessageId: result.messageId,
      deepLink,
    };
  }
}

/** Stub — wire APNs / FCM later. */
export class PushChannelAdapter implements CommunicationChannelAdapter {
  readonly channel = "push" as const;
  readonly providerName = "push_stub";

  async send(input: SendMessageInput): Promise<ChannelSendResult> {
    void input;
    return {
      success: false,
      status: "skipped",
      provider: this.providerName,
      skipped: true,
      error: "Push notifications are not configured yet.",
    };
  }
}

/** Stub — Twilio WhatsApp / Meta later. */
export class WhatsAppChannelAdapter implements CommunicationChannelAdapter {
  readonly channel = "whatsapp" as const;
  readonly providerName = "whatsapp_stub";

  async send(input: SendMessageInput): Promise<ChannelSendResult> {
    void input;
    return {
      success: false,
      status: "skipped",
      provider: this.providerName,
      skipped: true,
      error: "WhatsApp is not configured yet.",
    };
  }
}

/** Phase 1: outbound AI channel reserved; Emma conversations use the receptionist service. */
export class AiChannelAdapter implements CommunicationChannelAdapter {
  readonly channel = "ai" as const;
  readonly providerName = "emma_receptionist";

  async send(input: SendMessageInput): Promise<ChannelSendResult> {
    void input;
    return {
      success: false,
      status: "skipped",
      provider: this.providerName,
      skipped: true,
      error:
        "AI outbound messaging is reserved. Use Emma’s receptionist console for Phase 1 conversations.",
    };
  }
}

export function mapsUrlForAddress(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}
