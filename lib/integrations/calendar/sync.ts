import { createServiceClient } from "@/lib/supabase/service";
import { getCalendarAdapter } from "@/lib/integrations/calendar";
import { generateAppleIcsSecret } from "@/lib/integrations/calendar/apple";
import type { CalendarProvider } from "@/lib/types/integrations";

async function ensureFreshToken(connection: {
  id: string;
  provider: CalendarProvider;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
}) {
  if (
    !connection.refresh_token ||
    !connection.token_expires_at ||
    new Date(connection.token_expires_at) > new Date(Date.now() + 60_000)
  ) {
    return connection.access_token;
  }

  const adapter = getCalendarAdapter(connection.provider);
  if (!adapter) return connection.access_token;

  const refreshed = await adapter.refreshAccessToken(connection.refresh_token);
  const supabase = createServiceClient();

  await supabase
    .from("calendar_connections")
    .update({
      access_token: refreshed.accessToken,
      refresh_token: refreshed.refreshToken ?? connection.refresh_token,
      token_expires_at: refreshed.expiresAt.toISOString(),
    })
    .eq("id", connection.id);

  return refreshed.accessToken;
}

export async function syncCalendarConnection(connectionId: string) {
  const supabase = createServiceClient();

  const { data: connection } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (!connection || !connection.sync_enabled) return;

  if (connection.provider === "apple") {
    await supabase
      .from("calendar_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", connectionId);
    return;
  }

  const adapter = getCalendarAdapter(connection.provider as CalendarProvider);
  if (!adapter || !connection.access_token) return;

  const accessToken = await ensureFreshToken(connection);
  if (!accessToken) return;

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 60);

  const calendarId = connection.provider_calendar_id ?? "primary";
  const { events, nextSyncToken } = await adapter.listEvents(
    accessToken,
    calendarId,
    start.toISOString(),
    end.toISOString(),
    connection.sync_token,
  );

  for (const event of events) {
    await supabase.from("external_events").upsert(
      {
        calendar_connection_id: connectionId,
        external_event_id: event.id,
        title: event.title,
        start_time: event.start,
        end_time: event.end,
        is_busy: event.isBusy,
        raw_data: event.raw ?? null,
      },
      { onConflict: "calendar_connection_id,external_event_id" },
    );
  }

  await supabase
    .from("calendar_connections")
    .update({
      last_synced_at: new Date().toISOString(),
      sync_token: nextSyncToken ?? connection.sync_token,
    })
    .eq("id", connectionId);
}

export async function pushAppointmentToCalendars(appointmentId: string) {
  const supabase = createServiceClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      `*, service:services(name), staff:staff(id, name), customer:customers(name, email), business:businesses(name)`,
    )
    .eq("id", appointmentId)
    .single();

  if (!appointment || appointment.status === "cancelled") return;

  const { data: connections } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("business_id", appointment.business_id)
    .eq("sync_enabled", true)
    .or(`staff_id.is.null,staff_id.eq.${appointment.staff_id}`);

  for (const connection of connections ?? []) {
    if (connection.provider === "apple") continue;
    if (connection.sync_direction === "inbound") continue;

    const adapter = getCalendarAdapter(connection.provider as CalendarProvider);
    if (!adapter) continue;

    const accessToken = await ensureFreshToken(connection);
    if (!accessToken) continue;

    const service = appointment.service as { name: string };
    const staff = appointment.staff as { name: string };
    const customer = appointment.customer as { name: string; email: string };
    const business = appointment.business as { name: string };

    const eventPayload = {
      title: `${service.name} — ${customer.name}`,
      description: `Staff: ${staff.name}\nBusiness: ${business.name}`,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      attendees: [customer.email],
    };

    const calendarId = connection.provider_calendar_id ?? "primary";

    const { data: existing } = await supabase
      .from("external_events")
      .select("external_event_id")
      .eq("appointment_id", appointmentId)
      .eq("calendar_connection_id", connection.id)
      .maybeSingle();

    if (existing?.external_event_id) {
      await adapter.updateEvent(
        accessToken,
        calendarId,
        existing.external_event_id,
        eventPayload,
      );
    } else {
      const created = await adapter.createEvent(
        accessToken,
        calendarId,
        eventPayload,
      );
      await supabase.from("external_events").upsert({
        calendar_connection_id: connection.id,
        appointment_id: appointmentId,
        external_event_id: created.externalEventId,
        title: eventPayload.title,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        is_busy: true,
        raw_data: created.raw ?? null,
      });
      await supabase
        .from("appointments")
        .update({ external_event_id: created.externalEventId })
        .eq("id", appointmentId);
    }
  }
}

export async function deleteAppointmentFromCalendars(appointmentId: string) {
  const supabase = createServiceClient();

  const { data: links } = await supabase
    .from("external_events")
    .select("*, connection:calendar_connections(*)")
    .eq("appointment_id", appointmentId);

  for (const link of links ?? []) {
    const connection = link.connection as {
      id: string;
      provider: CalendarProvider;
      access_token: string | null;
      refresh_token: string | null;
      token_expires_at: string | null;
      provider_calendar_id: string | null;
    };

    if (connection.provider === "apple") continue;

    const adapter = getCalendarAdapter(connection.provider);
    if (!adapter) continue;

    const accessToken = await ensureFreshToken(connection);
    if (!accessToken) continue;

    await adapter.deleteEvent(
      accessToken,
      connection.provider_calendar_id ?? "primary",
      link.external_event_id,
    );

    await supabase.from("external_events").delete().eq("id", link.id);
  }
}

export async function createAppleCalendarConnection(
  businessId: string,
  staffId: string | null,
) {
  const supabase = createServiceClient();
  const icsSecret = generateAppleIcsSecret();

  const { data, error } = await supabase
    .from("calendar_connections")
    .insert({
      business_id: businessId,
      staff_id: staffId,
      provider: "apple",
      calendar_name: "Apple Calendar (ICS)",
      ics_secret: icsSecret,
      sync_direction: "outbound",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
