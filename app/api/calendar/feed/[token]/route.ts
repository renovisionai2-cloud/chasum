import { createServiceClient } from "@/lib/supabase/service";
import { generateIcsFeed } from "@/lib/integrations/calendar/apple";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const icsSecret = token.replace(/\.ics$/, "");
  const supabase = createServiceClient();

  const { data: connection } = await supabase
    .from("calendar_connections")
    .select("business_id, staff_id, business:businesses(name)")
    .eq("ics_secret", icsSecret)
    .eq("provider", "apple")
    .single();

  if (!connection) {
    return new Response("Not found", { status: 404 });
  }

  const businessRaw = connection.business as { name: string } | { name: string }[];
  const business = Array.isArray(businessRaw) ? businessRaw[0] : businessRaw;
  if (!business) {
    return new Response("Not found", { status: 404 });
  }
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const end = new Date(now);
  end.setDate(end.getDate() + 180);

  let query = supabase
    .from("appointments")
    .select(
      "id, start_time, end_time, status, service:services(name), staff:staff(name), customer:customers(name)",
    )
    .eq("business_id", connection.business_id)
    .gte("start_time", start.toISOString())
    .lte("start_time", end.toISOString());

  if (connection.staff_id) {
    query = query.eq("staff_id", connection.staff_id);
  }

  const { data: appointments } = await query;

  const ics = generateIcsFeed(
    business.name,
    (appointments ?? []).map((a) => ({
      ...a,
      service: Array.isArray(a.service) ? a.service[0] ?? null : a.service,
      staff: Array.isArray(a.staff) ? a.staff[0] ?? null : a.staff,
      customer: Array.isArray(a.customer) ? a.customer[0] ?? null : a.customer,
    })),
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="chasum-${icsSecret.slice(0, 8)}.ics"`,
      "Cache-Control": "no-cache",
    },
  });
}
