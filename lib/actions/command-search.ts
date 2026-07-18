"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getLocationScope } from "@/lib/actions/location";
import { matchCommandRegistry } from "@/lib/command/registry";
import { withLocationFilter } from "@/lib/location/constants";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export type CommandSearchCategory =
  | "pages"
  | "customers"
  | "staff"
  | "services"
  | "appointments"
  | "actions";

export type CommandSearchResult = {
  id: string;
  category: CommandSearchCategory;
  title: string;
  subtitle?: string;
  href: string;
};

export async function searchCommandPalette(
  rawQuery: string,
): Promise<CommandSearchResult[]> {
  const query = rawQuery.trim();
  const results: CommandSearchResult[] = [];

  for (const cmd of matchCommandRegistry(query)) {
    results.push({
      id: `cmd-${cmd.id}`,
      category: cmd.group === "actions" ? "actions" : "pages",
      title: cmd.title,
      subtitle: cmd.subtitle,
      href: cmd.href,
    });
  }

  if (!query) {
    return results.slice(0, 12);
  }

  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const supabase = await createClient();
  const q = query;

  const [customersRes, staffRes, servicesRes, appointmentsRes] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, name, preferred_name, email, phone, tags")
        .eq("business_id", business.id)
        .order("last_activity_at", { ascending: false, nullsFirst: false })
        .limit(80),
      (() => {
        let staffQuery = supabase
          .from("staff")
          .select("id, name, email, is_active")
          .eq("business_id", business.id)
          .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
          .order("name")
          .limit(8);
        staffQuery = withLocationFilter(staffQuery, scope);
        return staffQuery;
      })(),
      (() => {
        let servicesQuery = supabase
          .from("services")
          .select("id, name, duration_minutes, is_active")
          .eq("business_id", business.id)
          .ilike("name", `%${q}%`)
          .order("name")
          .limit(8);
        servicesQuery = withLocationFilter(servicesQuery, scope);
        return servicesQuery;
      })(),
      (() => {
        const from = new Date();
        from.setDate(from.getDate() - 14);
        const to = new Date();
        to.setDate(to.getDate() + 60);
        let apptQuery = supabase
          .from("appointments")
          .select(
            "id, start_time, status, customer:customers(name), service:services(name), staff:staff(name)",
          )
          .eq("business_id", business.id)
          .gte("start_time", from.toISOString())
          .lte("start_time", to.toISOString())
          .order("start_time", { ascending: true })
          .limit(40);
        apptQuery = withLocationFilter(apptQuery, scope);
        return apptQuery;
      })(),
    ]);

  const needle = q.toLowerCase();
  const digits = q.replace(/\D/g, "");
  const customerMatches = (customersRes.data ?? [])
    .filter((c) => {
      const hay = [
        c.name,
        c.preferred_name,
        c.email,
        c.phone,
        ...((c.tags as string[] | null) ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (hay.includes(needle)) return true;
      const phoneDigits = String(c.phone ?? "").replace(/\D/g, "");
      if (digits.length >= 3 && phoneDigits.includes(digits)) return true;
      return ((c.tags as string[] | null) ?? []).some((t) =>
        t.toLowerCase().includes(needle),
      );
    })
    .slice(0, 8);

  for (const c of customerMatches) {
    results.push({
      id: `customer-${c.id}`,
      category: "customers",
      title: (c.preferred_name as string | null)?.trim() || c.name,
      subtitle: [c.email, c.phone].filter(Boolean).join(" · "),
      href: `/dashboard/clients/${c.id}`,
    });
  }

  for (const s of staffRes.data ?? []) {
    results.push({
      id: `staff-${s.id}`,
      category: "staff",
      title: s.name,
      subtitle: s.is_active ? s.email ?? "Staff" : "Inactive",
      href: `/dashboard/employees/${s.id}`,
    });
  }

  for (const s of servicesRes.data ?? []) {
    results.push({
      id: `service-${s.id}`,
      category: "services",
      title: s.name,
      subtitle: `${s.duration_minutes} min${s.is_active ? "" : " · inactive"}`,
      href: "/dashboard/services",
    });
  }

  for (const a of appointmentsRes.data ?? []) {
    const customerName =
      (a.customer as { name?: string } | null)?.name?.toLowerCase() ?? "";
    const serviceName =
      (a.service as { name?: string } | null)?.name?.toLowerCase() ?? "";
    const staffName =
      (a.staff as { name?: string } | null)?.name?.toLowerCase() ?? "";
    if (
      !customerName.includes(needle) &&
      !serviceName.includes(needle) &&
      !staffName.includes(needle) &&
      !a.status.toLowerCase().includes(needle)
    ) {
      continue;
    }
    const when = format(new Date(a.start_time), "MMM d · h:mm a");
    results.push({
      id: `appointment-${a.id}`,
      category: "appointments",
      title:
        (a.customer as { name?: string } | null)?.name ?? "Appointment",
      subtitle: [
        when,
        (a.service as { name?: string } | null)?.name,
        a.status,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/dashboard/calendar?date=${encodeURIComponent(a.start_time)}&appointment=${a.id}`,
    });
  }

  return results.slice(0, 24);
}
