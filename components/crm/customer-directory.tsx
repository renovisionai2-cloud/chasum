"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TagBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CrmDirectoryCustomer } from "@/lib/actions/crm";
import { displayCustomerName } from "@/lib/crm/display";
import {
  CRM_STATUS_LABELS,
  type CrmStatus,
} from "@/lib/crm/types";
import type { Location, Staff } from "@/lib/types/booking";
import { Plus, Search, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export function CustomerDirectory({
  customers,
  staff,
  locations,
  onAdd,
}: {
  customers: CrmDirectoryCustomer[];
  staff: Staff[];
  locations: Location[];
  onAdd: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [locationId, setLocationId] = useState("all");
  const [staffId, setStaffId] = useState("all");
  const [tag, setTag] = useState("all");
  const [recentOnly, setRecentOnly] = useState(false);
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
      if (status !== "all") {
        const crmStatus = customer.crm_status ?? "active";
        if (crmStatus !== status) return false;
      }
      if (locationId !== "all" && customer.preferred_location_id !== locationId) {
        return false;
      }
      if (staffId !== "all" && customer.assigned_staff_id !== staffId) {
        return false;
      }
      if (tag !== "all" && !(customer.tags ?? []).includes(tag)) return false;
      if (recentOnly) {
        const activity = customer.last_activity_at
          ? new Date(customer.last_activity_at).getTime()
          : new Date(customer.updated_at).getTime();
        if (activity < weekAgo) return false;
      }
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
      // Light fuzzy: all query tokens must appear
      const tokens = q.split(/\s+/).filter(Boolean);
      return tokens.every((t) => haystack.includes(t));
    });
  }, [customers, search, status, locationId, staffId, tag, recentOnly, nowMs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search customers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search customers"
          />
        </div>
        <Button type="button" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add customer
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
          aria-label="Filter by location"
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
          {staff.map((member) => (
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
        <Select
          aria-label="Recently active"
          value={recentOnly ? "recent" : "all"}
          onChange={(e) => setRecentOnly(e.target.value === "recent")}
        >
          <option value="all">Any activity</option>
          <option value="recent">Recently active (7d)</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="panel"
          glyph={Users}
          title={customers.length === 0 ? "No customers yet" : "No matches"}
          description={
            customers.length === 0
              ? "Add your first customer to start building relationships."
              : "Try a different search or filter."
          }
        >
          {customers.length === 0 ? (
            <Button type="button" onClick={onAdd} className="mt-4">
              <Plus className="h-4 w-4" />
              Add customer
            </Button>
          ) : null}
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {filtered.map((customer) => {
            const crmStatus = (customer.crm_status ?? "active") as CrmStatus;
            return (
              <Link key={customer.id} href={`/dashboard/clients/${customer.id}`}>
                <Card className="ds-card-interactive transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      {customer.photo_url ? (
                        <Image
                          src={customer.photo_url}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
                          {displayCustomerName(customer)
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
                        <p className="truncate font-medium">
                          {displayCustomerName(customer)}
                        </p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {CRM_STATUS_LABELS[crmStatus] ?? crmStatus}
                        </span>
                        {customer.is_vip ? (
                          <span className="rounded-full bg-spark-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-spark">
                            VIP
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {customer.assigned_staff?.name
                          ? `Assigned: ${customer.assigned_staff.name}`
                          : "Unassigned"}
                        {customer.preferred_location?.name
                          ? ` · ${customer.preferred_location.name}`
                          : ""}
                      </p>
                      {(customer.tags?.length ?? 0) > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {customer.tags.slice(0, 4).map((t, i) => (
                            <TagBadge key={t} tag={t} index={i} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {customers.length} customers
      </p>
    </div>
  );
}
