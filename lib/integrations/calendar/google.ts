import { getAppUrl, getGoogleOAuthConfig } from "@/lib/env";
import type {
  CalendarEventPayload,
  CalendarProviderAdapter,
} from "@/lib/integrations/providers/types";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function getGoogleAuthUrl(state: string): string | null {
  const config = getGoogleOAuthConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${getAppUrl()}/api/integrations/google/callback`,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const config = getGoogleOAuthConfig();
  if (!config) throw new Error("Google OAuth is not configured.");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: `${getAppUrl()}/api/integrations/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.error ?? "Failed to exchange Google auth code.");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  };
}

export const googleCalendarAdapter: CalendarProviderAdapter = {
  provider: "google",

  async refreshAccessToken(refreshToken) {
    const config = getGoogleOAuthConfig();
    if (!config) throw new Error("Google OAuth is not configured.");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    };

    if (!data.access_token) throw new Error("Failed to refresh Google token.");

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
      refreshToken: data.refresh_token,
    };
  },

  async listEvents(accessToken, calendarId, start, end, syncToken) {
    const params = new URLSearchParams({
      singleEvents: "true",
      showDeleted: "false",
    });

    if (syncToken) {
      params.set("syncToken", syncToken);
    } else {
      params.set("timeMin", start);
      params.set("timeMax", end);
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
        transparency?: string;
      }>;
      nextSyncToken?: string;
    };

    const events = (data.items ?? []).map((item) => ({
      id: item.id,
      title: item.summary ?? "Busy",
      start: item.start?.dateTime ?? `${item.start?.date}T00:00:00Z`,
      end: item.end?.dateTime ?? `${item.end?.date}T23:59:59Z`,
      isBusy: item.transparency !== "transparent",
      raw: item,
    }));

    return { events, nextSyncToken: data.nextSyncToken };
  },

  async createEvent(accessToken, calendarId, event: CalendarEventPayload) {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
          location: event.location,
          attendees: event.attendees?.map((email) => ({ email })),
        }),
      },
    );

    const data = (await res.json()) as { id?: string };
    if (!data.id) throw new Error("Failed to create Google Calendar event.");
    return { externalEventId: data.id, raw: data };
  },

  async updateEvent(accessToken, calendarId, externalEventId, event) {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${externalEventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
        }),
      },
    );
    if (!res.ok) throw new Error("Failed to update Google Calendar event.");
  },

  async deleteEvent(accessToken, calendarId, externalEventId) {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${externalEventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok && res.status !== 404) {
      throw new Error("Failed to delete Google Calendar event.");
    }
  },
};
