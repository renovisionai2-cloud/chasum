import {
  getEmailFromAddress,
  getResendApiKey,
  isProductionRuntime,
} from "@/lib/env";
import type { EmailProvider, EmailPayload, EmailResult } from "./types";

class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  async send(payload: EmailPayload): Promise<EmailResult> {
    const apiKey = getResendApiKey();
    if (!apiKey) {
      return {
        success: false,
        error:
          "Email delivery is not configured yet. Set up email in Communications before sending messages to customers.",
      };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFromAddress(),
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(payload.attachments?.length
          ? {
              attachments: payload.attachments.map((file) => ({
                filename: file.filename,
                content: file.content,
                content_type: file.contentType ?? "application/octet-stream",
              })),
            }
          : {}),
      }),
    });

    const data = (await res.json()) as {
      id?: string;
      message?: string;
      name?: string;
    };
    if (!res.ok) {
      const from = getEmailFromAddress();
      let detail = data.message ?? data.name ?? "Failed to send email.";
      if (/smtp|icloud|550|553|554|blocked|not verified|domain|rejected/i.test(detail)) {
        detail = `${detail} Chasum attempted delivery via Resend; the mail provider rejected it. Verify the From address (${from}) domain in Resend and that the recipient inbox can accept mail.`;
      } else {
        detail = `${detail} (from ${from}). Confirm the sender domain is verified for email delivery.`;
      }
      return {
        success: false,
        error: detail,
      };
    }
    return { success: true, messageId: data.id };
  }
}

class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(payload: EmailPayload): Promise<EmailResult> {
    console.info(
      "[email]",
      payload.to,
      payload.subject,
      payload.attachments?.length
        ? `(${payload.attachments.length} attachment(s))`
        : "",
    );
    return { success: true, messageId: `console-${Date.now()}` };
  }
}

/** Production without Resend must not pretend to send. */
class DisabledEmailProvider implements EmailProvider {
  readonly name = "disabled";

  async send(_payload: EmailPayload): Promise<EmailResult> {
    return {
      success: false,
      error:
        "Email delivery is not configured yet. Set up email in Communications before sending messages to customers.",
    };
  }
}

let emailProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!emailProvider) {
    if (getResendApiKey()) {
      emailProvider = new ResendEmailProvider();
    } else if (isProductionRuntime()) {
      emailProvider = new DisabledEmailProvider();
    } else {
      emailProvider = new ConsoleEmailProvider();
    }
  }
  return emailProvider;
}

/** Reset cached provider (tests / env changes). */
export function resetEmailProvider(): void {
  emailProvider = null;
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  return getEmailProvider().send(payload);
}

export function isEmailDeliverable(): boolean {
  return Boolean(getResendApiKey());
}
