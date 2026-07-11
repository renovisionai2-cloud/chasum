import { getAppUrl, getMicrosoftOAuthConfig } from "@/lib/env";
import type {
  CalendarEventPayload,
  CalendarProviderAdapter,
} from "@/lib/integrations/providers/types";

const SCOPES = [
  "offline_access",
  "Calendars.ReadWrite",
  "User.Read",
].join(" ");

export function getOutlookAuthUrl(state: string): string | null {
  const config = getMicrosoftOAuthConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${getAppUrl()}/api/integrations/outlook/callback`,
    response_type: "code",
    scope: SCOPES,
    state,
  });

  return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeOutlookCode(code: string) {
  const config = getMicrosoftOAuthConfig();
  if (!config) throw new Error("Microsoft OAuth is not configured.");

  const res = await fetch(
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: `${getAppUrl()}/api/integrations/outlook/callback`,
        grant_type: "authorization_code",
        code,
      }),
    },
  );

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? "Failed to exchange Microsoft auth code.");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  };
}

export const outlookCalendarAdapter: CalendarProviderAdapter = {
  provider: "outlook",

  async refreshAccessToken(refreshToken) {
    const config = getMicrosoftOAuthConfig();
    if (!config) throw new Error("Microsoft OAuth is not configured.");

    const res = await fetch(
      `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      },
    );

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };

    if (!data.access_token) throw new Error("Failed to refresh Microsoft token.");

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
      refreshToken: data.refresh_token,
    };
  },

  async listEvents(accessToken, calendarId, start, end) {
    const params = new URLSearchParams({
      startDateTime: start,
      endDateTime: end,
      $select: "id,subject,start,end,showAs",
    });

    const calPath =
      calendarId === "primary"
        ? "/me/calendar/events"
        : `/me/calendars/${calendarId}/events`;

    const res = await fetch(
      `https://graph.microsoft.com/v1.0${calPath}?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = (await res.json()) as {
      value?: Array<{
        id: string;
        subject?: string;
        start?: { dateTime: string };
        end?: { dateTime: string };
        showAs?: string;
      }>;
    };

    const events = (data.value ?? []).map((item) => ({
      id: item.id,
      title: item.subject ?? "Busy",
      start: item.start?.dateTime ?? start,
      end: item.end?.dateTime ?? end,
      isBusy: item.showAs !== "free",
      raw: item,
    }));

    return { events };
  },

  async createEvent(accessToken, calendarId, event: CalendarEventPayload) {
    const calPath =
      calendarId === "primary"
        ? "/me/calendar/events"
        : `/me/calendars/${calendarId}/events`;

    const res = await fetch(`https://graph.microsoft.com/v1.0${calPath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: event.title,
        body: { contentType: "text", content: event.description ?? "" },
        start: { dateTime: event.startTime, timeZone: "UTC" },
        end: { dateTime: event.endTime, timeZone: "UTC" },
      }),
    });

    const data = (await res.json()) as { id?: string };
    if (!data.id) throw new Error("Failed to create Outlook event.");
    return { externalEventId: data.id, raw: data };
  },

  async updateEvent(accessToken, calendarId, externalEventId, event) {
    const calPath =
      calendarId === "primary"
        ? `/me/calendar/events/${externalEventId}`
        : `/me/calendars/${calendarId}/events/${externalEventId}`;

    const res = await fetch(`https://graph.microsoft.com/v1.0${calPath}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: event.title,
        start: { dateTime: event.startTime, timeZone: "UTC" },
        end: { dateTime: event.endTime, timeZone: "UTC" },
      }),
    });
    if (!res.ok) throw new Error("Failed to update Outlook event.");
  },

  async deleteEvent(accessToken, calendarId, externalEventId) {
    const calPath =
      calendarId === "primary"
        ? `/me/calendar/events/${externalEventId}`
        : `/me/calendars/${calendarId}/events/${externalEventId}`;

    const res = await fetch(`https://graph.microsoft.com/v1.0${calPath}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error("Failed to delete Outlook event.");
    }
  },
};
