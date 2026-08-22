"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getLocationScope } from "@/lib/actions/location";
import { matchCommandRegistry } from "@/lib/command/registry";
import { invoiceWorkspacePath } from "@/lib/commerce/document-paths";
import { withLocationFilter } from "@/lib/location/constants";
import { isPlatformOwner } from "@/lib/owner/auth";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export type CommandSearchCategory =
  | "pages"
  | "customers"
  | "staff"
  | "services"
  | "appointments"
  | "actions"
  | "packages"
  | "memberships"
  | "gift_cards"
  | "invoices"
  | "locations";

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

  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  const showOwnerCommands = user ? await isPlatformOwner(user) : false;

  for (const cmd of matchCommandRegistry(query)) {
    if (cmd.ownerOnly && !showOwnerCommands) continue;
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
  const supabase = supabaseAuth;
  const q = query;

  const [
    customersRes,
    staffRes,
    servicesRes,
    appointmentsRes,
    packagesRes,
    membershipsRes,
    giftCardsRes,
    invoicesRes,
    locationsRes,
  ] =
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
      supabase
        .from("service_packages")
        .select("id, name, total_visits, is_active")
        .eq("business_id", business.id)
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(8),
      supabase
        .from("memberships")
        .select("id, name, billing_interval, is_active")
        .eq("business_id", business.id)
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(8),
      supabase
        .from("gift_cards")
        .select("id, code, status")
        .eq("business_id", business.id)
        .ilike("code", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("commerce_invoices")
        .select("id, invoice_number, status")
        .eq("business_id", business.id)
        .ilike("invoice_number", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("locations")
        .select("id, name, is_active")
        .eq("business_id", business.id)
        .eq("is_active", true)
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(8),
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

  for (const pkg of packagesRes.error ? [] : (packagesRes.data ?? [])) {
    results.push({
      id: `package-${pkg.id}`,
      category: "packages",
      title: pkg.name,
      subtitle: `${pkg.total_visits} visit${pkg.total_visits === 1 ? "" : "s"}${
        pkg.is_active ? "" : " · inactive"
      }`,
      href: "/dashboard/business?tab=packages",
    });
  }

  for (const membership of membershipsRes.error
    ? []
    : (membershipsRes.data ?? [])) {
    results.push({
      id: `membership-${membership.id}`,
      category: "memberships",
      title: membership.name,
      subtitle: "Preview / Coming Soon",
      href: "/dashboard/business?tab=memberships",
    });
  }

  for (const card of giftCardsRes.error ? [] : (giftCardsRes.data ?? [])) {
    results.push({
      id: `gift-card-${card.id}`,
      category: "gift_cards",
      title: card.code,
      subtitle: card.status ? `Gift card · ${card.status}` : "Gift card",
      href: "/dashboard/business?tab=giftcards",
    });
  }

  for (const invoice of invoicesRes.error ? [] : (invoicesRes.data ?? [])) {
    const number = String(invoice.invoice_number ?? "").trim();
    if (!number) continue;
    results.push({
      id: `invoice-${invoice.id}`,
      category: "invoices",
      title: number,
      subtitle: invoice.status ? `Invoice · ${invoice.status}` : "Invoice",
      href: invoiceWorkspacePath(number),
    });
  }

  for (const location of locationsRes.error ? [] : (locationsRes.data ?? [])) {
    results.push({
      id: `location-${location.id}`,
      category: "locations",
      title: location.name,
      subtitle: "Location",
      href: "/dashboard/business?tab=locations",
    });
  }

  return results.slice(0, 24);
}
