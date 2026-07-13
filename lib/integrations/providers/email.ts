import { getEmailFromAddress, getResendApiKey } from "@/lib/env";
import type { EmailProvider, EmailPayload, EmailResult } from "./types";

class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  async send(payload: EmailPayload): Promise<EmailResult> {
    const apiKey = getResendApiKey();
    if (!apiKey) {
      return { success: false, error: "RESEND_API_KEY is not configured." };
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

    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      return { success: false, error: data.message ?? "Failed to send email." };
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

let emailProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!emailProvider) {
    emailProvider = getResendApiKey()
      ? new ResendEmailProvider()
      : new ConsoleEmailProvider();
  }
  return emailProvider;
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  return getEmailProvider().send(payload);
}
