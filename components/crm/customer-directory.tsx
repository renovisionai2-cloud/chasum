"use client";

import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CrmDirectoryCustomer } from "@/lib/actions/crm";
import { formatMoneyCents } from "@/lib/commerce/money";
import { displayCustomerName } from "@/lib/crm/display";
import {
  isNewCustomer,
  type DirectoryQuickFilter,
} from "@/lib/crm/directory-metrics";
import {
  CRM_STATUS_LABELS,
  type CrmStatus,
} from "@/lib/crm/types";
import type { Location, Staff } from "@/lib/types/booking";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const QUICK_FILTERS: { id: DirectoryQuickFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "vip", label: "VIP" },
  { id: "new", label: "New" },
  { id: "recent", label: "Recent" },
  { id: "outstanding", label: "Balance due" },
];

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d");
  } catch {
    return "—";
  }
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
  const [nowMs] = useState(() => Date.now());

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const customer of customers) {
      for (const t of customer.tags ?? []) set.add(t);
    }
    return Array.from(set).sort();
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const weekAgo = nowMs - 7 * 24 * 60 * 60 * 1000;

    return customers.filter((customer) => {
      const crmStatus = customer.crm_status ?? "active";

      if (quick === "active" && crmStatus !== "active" && crmStatus !== "vip") {
        return false;
      }
      if (quick === "inactive" && crmStatus !== "inactive" && crmStatus !== "archived") {
        return false;
      }
      if (quick === "vip" && !customer.is_vip && crmStatus !== "vip") {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="min-h-[var(--touch-min)] pl-9"
            placeholder="Search name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search customers by name, email, or phone"
          />
        </div>
        <Button
          type="button"
          onClick={onAdd}
          className="min-h-[var(--touch-min)] font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add customer
        </Button>
      </div>

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Quick filters"
      >
        {QUICK_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setQuick(item.id)}
            className={cn(
              "min-h-9 rounded-md px-3 text-xs font-medium transition-colors ds-focus-ring",
              quick === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-pressed={quick === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {Object.entries(CRM_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
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
              : "Try a different search or clear filters."
          }
        >
          {customers.length === 0 ? (
            <Button type="button" onClick={onAdd} className="mt-4">
              <Plus className="h-4 w-4" />
              Add customer
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setLocationId("all");
                setStaffId("all");
                setTag("all");
                setQuick("all");
              }}
            >
              Reset filters
            </Button>
          )}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-sm">
          {filtered.map((customer) => {
            const crmStatus = (customer.crm_status ?? "active") as CrmStatus;
            const outstanding = Number(customer.outstanding_balance_cents ?? 0);
            const name = displayCustomerName(customer);
            return (
              <li key={customer.id}>
                <Link
                  href={`/dashboard/clients/${customer.id}`}
                  className="flex flex-col gap-3 px-3 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-4 sm:px-4"
                  aria-label={`${name}, ${CRM_STATUS_LABELS[crmStatus] ?? crmStatus}${outstanding > 0 ? `, balance due ${formatMoneyCents(outstanding, currency)}` : ""}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      {customer.photo_url ? (
                        <Image
                          src={customer.photo_url}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs font-semibold text-muted-foreground">
                          {name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold tracking-tight">
                          {name}
                        </p>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {CRM_STATUS_LABELS[crmStatus] ?? crmStatus}
                        </span>
                        {customer.is_vip || crmStatus === "vip" ? (
                          <span className="rounded-md bg-spark-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-spark">
                            VIP
                          </span>
                        ) : null}
                        {outstanding > 0 ? (
                          <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
                            Balance due
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {customer.assigned_staff?.name
                          ? customer.assigned_staff.name
                          : "No assigned employee"}
                        {customer.preferred_location?.name
                          ? ` · ${customer.preferred_location.name}`
                          : ""}
                      </p>
                      {(customer.tags?.length ?? 0) > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {customer.tags.slice(0, 4).map((t, i) => (
                            <TagBadge key={t} tag={t} index={i} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-[11px] sm:w-[18rem] sm:shrink-0">
                    <div>
                      <dt className="text-muted-foreground">Last visit</dt>
                      <dd className="font-medium tabular-nums">
                        {formatShortDate(customer.last_visit_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Next</dt>
                      <dd className="font-medium tabular-nums">
                        {formatShortDate(customer.next_appointment_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Outstanding</dt>
                      <dd
                        className={cn(
                          "font-medium tabular-nums",
                          outstanding > 0 &&
                            "text-amber-800 dark:text-amber-200",
                        )}
                      >
                        {outstanding > 0
                          ? formatMoneyCents(outstanding, currency)
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground" role="status">
        Showing {filtered.length} of {customers.length} customers
        {quick !== "all" ? ` · filter: ${quick}` : ""}
      </p>
    </div>
  );
}
