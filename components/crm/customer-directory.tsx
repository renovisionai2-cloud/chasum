"use client";

import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import type { CrmDirectoryCustomer } from "@/lib/actions/crm";
import { formatMoneyCents } from "@/lib/commerce/money";
import { displayCustomerName } from "@/lib/crm/display";
import {
  isNewCustomer,
  type DirectoryQuickFilter,
} from "@/lib/crm/directory-metrics";
import {
  CRM_STATUS_FILTER_OPTIONS,
  displayCrmStatusLabel,
  isVipCustomer,
} from "@/lib/crm/customer-health";
import type { Location, Staff } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronRight, Filter, Plus, Search, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const QUICK_FILTERS: {
  id: DirectoryQuickFilter;
  label: string;
  kind: "all" | "status" | "segment";
}[] = [
  { id: "all", label: "All", kind: "all" },
  { id: "active", label: "Active", kind: "status" },
  { id: "inactive", label: "Inactive", kind: "status" },
  { id: "vip", label: "VIP", kind: "segment" },
  { id: "new", label: "New", kind: "segment" },
  { id: "recent", label: "Recent", kind: "segment" },
  { id: "outstanding", label: "Balance due", kind: "segment" },
];

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d");
  } catch {
    return "—";
  }
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CustomerDirectory({
  customers,
  staff,
  locations,
  onAdd,
  currency = "cad",
}: {
  customers: CrmDirectoryCustomer[];
  staff: Staff[];
  locations: Location[];
  onAdd: () => void;
  currency?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [locationId, setLocationId] = useState("all");
  const [staffId, setStaffId] = useState("all");
  const [tag, setTag] = useState("all");
  const [quick, setQuick] = useState<DirectoryQuickFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [nowMs] = useState(() => Date.now());

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const customer of customers) {
      for (const t of customer.tags ?? []) set.add(t);
    }
    return Array.from(set).sort();
  }, [customers]);

  const filtersActive =
    search.trim() !== "" ||
    status !== "all" ||
    locationId !== "all" ||
    staffId !== "all" ||
    tag !== "all" ||
    quick !== "all";

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setLocationId("all");
    setStaffId("all");
    setTag("all");
    setQuick("all");
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const weekAgo = nowMs - 7 * 24 * 60 * 60 * 1000;

    return customers.filter((customer) => {
      const crmStatus = customer.crm_status ?? "active";

      if (quick === "active" && crmStatus !== "active" && crmStatus !== "vip") {
        return false;
      }
      if (
        quick === "inactive" &&
        crmStatus !== "inactive"
      ) {
        return false;
      }
      if (quick === "vip" && !isVipCustomer(customer)) {
        return false;
      }
      if (quick === "new" && !isNewCustomer(customer.created_at, nowMs)) {
        return false;
      }
      if (quick === "recent") {
        const activity = customer.last_activity_at
          ? new Date(customer.last_activity_at).getTime()
          : new Date(customer.updated_at).getTime();
        if (activity < weekAgo) return false;
      }
      if (
        quick === "outstanding" &&
        !(Number(customer.outstanding_balance_cents ?? 0) > 0)
      ) {
        return false;
      }

      if (status !== "all" && crmStatus !== status) return false;
      if (locationId !== "all" && customer.preferred_location_id !== locationId) {
        return false;
      }
      if (staffId !== "all" && customer.assigned_staff_id !== staffId) {
        return false;
      }
      if (tag !== "all" && !(customer.tags ?? []).includes(tag)) return false;

      if (!q) return true;
      const digits = q.replace(/\D/g, "");
      const phoneDigits = (customer.phone ?? "").replace(/\D/g, "");
      const haystack = [
        customer.name,
        customer.preferred_name,
        customer.first_name,
        customer.last_name,
        customer.email,
        customer.phone,
        ...(customer.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (haystack.includes(q)) return true;
      if (digits.length >= 3 && phoneDigits.includes(digits)) return true;
      const tokens = q.split(/\s+/).filter(Boolean);
      return tokens.every((t) => haystack.includes(t));
    });
  }, [
    customers,
    search,
    status,
    locationId,
    staffId,
    tag,
    quick,
    nowMs,
  ]);

  const quickLabel =
    QUICK_FILTERS.find((f) => f.id === quick)?.label ?? quick;

  const secondaryFilters = (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          CRM status
        </p>
        <Select
          aria-label="Filter by CRM status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {CRM_STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <p className="text-[10px] text-muted-foreground">
          Persisted status. VIP / New / Recent / Balance due are segments above.
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Preferred location
        </p>
        <Select
          aria-label="Filter by preferred location"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        >
          <option value="all">All locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Preferred employee
        </p>
        <Select
          aria-label="Filter by assigned employee"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        >
          <option value="all">All employees</option>
          {[...staff]
            .sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
            )
            .map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
        </Select>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Tag
        </p>
        <Select
          aria-label="Filter by tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        >
          <option value="all">All tags</option>
          {allTags.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="min-h-11 pl-9"
            placeholder="Search name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search customers by name, email, or phone"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filtersActive ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:hidden"
            onClick={() => setFiltersOpen(true)}
            aria-label="Open filters"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            type="button"
            onClick={onAdd}
            className="min-h-11 font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Quick segments"
      >
        {QUICK_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setQuick(item.id)}
            className={cn(
              "min-h-11 rounded-md px-3 text-xs font-semibold transition-colors ds-focus-ring",
              quick === item.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-pressed={quick === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="hidden md:block">{secondaryFilters}</div>

      <p className="text-xs text-muted-foreground" role="status">
        {filtered.length} customer{filtered.length === 1 ? "" : "s"}
        {quick !== "all" ? ` · ${quickLabel}` : ""}
        {filtersActive && quick === "all" ? " · filtered" : ""}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          variant="panel"
          glyph={Users}
          title={
            customers.length === 0
              ? "Add your first customer"
              : "No customers match"
          }
          description={
            customers.length === 0
              ? "Create a profile to book visits, collect payments, and keep notes in one place."
              : "Try a different search or clear filters to see more customers."
          }
        >
          {customers.length === 0 ? (
            <Button type="button" onClick={onAdd} className="mt-4 min-h-11">
              <Plus className="h-4 w-4" />
              Add customer
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
          <div className="hidden border-b border-border bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[minmax(14rem,1.6fr)_5.5rem_7rem_7rem_5.5rem_5.5rem_6.5rem_2rem] lg:gap-2 lg:px-4">
            <span>Customer</span>
            <span>Status</span>
            <span>Employee</span>
            <span>Location</span>
            <span>Last visit</span>
            <span>Next</span>
            <span className="text-right">Outstanding</span>
            <span className="sr-only">Open</span>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((customer) => {
              const crmStatus = customer.crm_status ?? "active";
              const outstanding = Number(
                customer.outstanding_balance_cents ?? 0,
              );
              const name = displayCustomerName(customer);
              const employee = customer.assigned_staff?.name ?? null;
              const location = customer.preferred_location?.name ?? null;
              return (
                <li key={customer.id}>
                  <Link
                    href={`/dashboard/clients/${customer.id}`}
                    className="group grid gap-2 px-3 py-2.5 transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4 lg:grid-cols-[minmax(14rem,1.6fr)_5.5rem_7rem_7rem_5.5rem_5.5rem_6.5rem_2rem] lg:items-center lg:gap-2"
                    aria-label={`${name}, ${displayCrmStatusLabel(crmStatus)}${outstanding > 0 ? `, balance due ${formatMoneyCents(outstanding, currency)}` : ""}`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                        {customer.photo_url ? (
                          <Image
                            src={customer.photo_url}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                            {initials(name)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold tracking-tight">
                            {name}
                          </p>
                          {isVipCustomer(customer) ? (
                            <span className="rounded-md bg-spark-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-spark">
                              VIP
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {customer.email}
                          {customer.phone ? ` · ${customer.phone}` : ""}
                        </p>
                        {(customer.tags?.length ?? 0) > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1 lg:hidden">
                            {customer.tags.slice(0, 3).map((t, i) => (
                              <TagBadge key={t} tag={t} index={i} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs lg:contents">
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground lg:w-fit">
                        {displayCrmStatusLabel(crmStatus)}
                      </span>
                      <span className="truncate text-muted-foreground">
                        <span className="lg:hidden">Employee · </span>
                        {employee ?? (
                          <span className="text-muted-foreground/80">
                            Unassigned
                          </span>
                        )}
                      </span>
                      <span className="truncate text-muted-foreground">
                        <span className="lg:hidden">Location · </span>
                        {location ?? "—"}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        <span className="lg:hidden">Last · </span>
                        {formatShortDate(customer.last_visit_at)}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        <span className="lg:hidden">Next · </span>
                        {formatShortDate(customer.next_appointment_at)}
                      </span>
                      <span
                        className={cn(
                          "ml-auto text-right font-medium tabular-nums lg:ml-0",
                          outstanding > 0 &&
                            "text-amber-800 dark:text-amber-200",
                        )}
                      >
                        {outstanding > 0
                          ? formatMoneyCents(outstanding, currency)
                          : "—"}
                      </span>
                      <ChevronRight
                        className="ml-1 size-4 shrink-0 text-muted-foreground opacity-60 transition group-hover:opacity-100 lg:ml-0"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        description="CRM status is persisted. VIP, New, Recent, and Balance due are derived segments."
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => {
                clearFilters();
                setFiltersOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              className="min-h-11 flex-1"
              onClick={() => setFiltersOpen(false)}
            >
              Done
            </Button>
          </div>
        }
      >
        {secondaryFilters}
      </Sheet>
    </div>
  );
}
