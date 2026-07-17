"use client";

import { ServiceCategoriesPanel } from "@/components/services/service-categories-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/page-header";
import {
  confirmDelete,
  useFormAction,
  useRefresh,
} from "@/hooks/use-form-action";
import type { ServiceCategory } from "@/lib/business/types";
import {
  createService,
  deleteService,
  deleteServiceBlackout,
  getServiceBlackouts,
  getServiceLocationIds,
  getServiceStaffAssignments,
  updateService,
  upsertServiceBlackout,
} from "@/lib/actions/services";
import type {
  ActionState,
  Location,
  Service,
  ServiceBlackout,
  ServiceStaffAssignment,
  Staff,
} from "@/lib/types/booking";
import { SERVICE_COLORS } from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 12;

type TabKey = "catalog" | "categories";
type SortKey = "name" | "price" | "duration" | "order";

function centsToDollars(cents?: number): string {
  if (cents == null || !Number.isFinite(cents)) return "";
  return (cents / 100).toFixed(2);
}

function ServiceForm({
  service,
  categories,
  staff,
  locations,
  onClose,
}: {
  service?: Service;
  categories: ServiceCategory[];
  staff: Pick<Staff, "id" | "name" | "title" | "is_active" | "location_id" | "color">[];
  locations: Location[];
  onClose: () => void;
}) {
  const action = service ? updateService : createService;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const [assignments, setAssignments] = useState<ServiceStaffAssignment[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>(() => {
    if (service?.location_id) return [service.location_id];
    return locations[0] ? [locations[0].id] : [];
  });
  const [blackouts, setBlackouts] = useState<ServiceBlackout[]>([]);
  const [depositRequired, setDepositRequired] = useState(
    Boolean(service?.deposit_required) || (service?.deposit_cents ?? 0) > 0,
  );
  const [loadingMeta, setLoadingMeta] = useState(Boolean(service));
  const { toast } = useToast();
  const refresh = useRefresh();

  const [blackoutState, blackoutAction, blackoutPending] = useActionState(
    upsertServiceBlackout,
    {} as ActionState,
  );

  useFormAction(state, undefined, onClose);
  useFormAction(blackoutState, () => {
    if (!service) return;
    void getServiceBlackouts(service.id).then(setBlackouts);
    refresh();
  });

  useEffect(() => {
    if (!service) return;

    let cancelled = false;
    void Promise.all([
      getServiceStaffAssignments(service.id),
      getServiceLocationIds(service.id),
      getServiceBlackouts(service.id),
    ]).then(([staffRows, locs, blackoutRows]) => {
      if (cancelled) return;
      setAssignments(staffRows);
      setLocationIds(
        locs.length > 0
          ? locs
          : service.location_id
            ? [service.location_id]
            : [],
      );
      setBlackouts(blackoutRows);
      setLoadingMeta(false);
    });

    return () => {
      cancelled = true;
    };
  }, [service]);

  const selectedCategoryId =
    service?.category_id ??
    categories.find((c) => c.name === service?.category)?.id ??
    "";

  async function handleDeleteBlackout(id: string) {
    if (!(await confirmDelete("Delete this blackout period?"))) return;
    const result = await deleteServiceBlackout(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Blackout deleted.", "success");
      if (service) setBlackouts(await getServiceBlackouts(service.id));
      refresh();
    }
  }

  const form = (
    <form action={formAction} className="max-h-[75vh] space-y-5 overflow-y-auto pr-1">
      {service && <input type="hidden" name="id" value={service.id} />}

      <section className="space-y-4" aria-labelledby="service-basics">
        <h3 id="service-basics" className="text-sm font-semibold">
          Service information
        </h3>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={service?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={service?.description ?? ""}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            <Select
              id="category_id"
              name="category_id"
              defaultValue={selectedCategoryId}
              onChange={(event) => {
                const selected = categories.find(
                  (c) => c.id === event.target.value,
                );
                const nameInput = document.getElementById(
                  "category",
                ) as HTMLInputElement | null;
                if (nameInput) nameInput.value = selected?.name ?? "";
              }}
            >
              <option value="">Uncategorized</option>
              {categories
                .filter((c) => c.is_active || c.id === selectedCategoryId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </Select>
            <input
              type="hidden"
              id="category"
              name="category"
              defaultValue={
                categories.find((c) => c.id === selectedCategoryId)?.name ??
                service?.category ??
                ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Display order</Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              min={0}
              defaultValue={service?.sort_order ?? 0}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <ColorPicker
            name="color"
            colors={SERVICE_COLORS}
            defaultValue={service?.color ?? SERVICE_COLORS[0]}
          />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="service-timing">
        <h3 id="service-timing" className="text-sm font-semibold">
          Duration & buffers
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duration (min)</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min={5}
              step={5}
              defaultValue={service?.duration_minutes ?? 30}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cleanup_minutes">Cleanup time (min)</Label>
            <Input
              id="cleanup_minutes"
              name="cleanup_minutes"
              type="number"
              min={0}
              step={5}
              defaultValue={service?.cleanup_minutes ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buffer_before_minutes">Buffer before (min)</Label>
            <Input
              id="buffer_before_minutes"
              name="buffer_before_minutes"
              type="number"
              min={0}
              step={5}
              defaultValue={service?.buffer_before_minutes ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buffer_after_minutes">Buffer after (min)</Label>
            <Input
              id="buffer_after_minutes"
              name="buffer_after_minutes"
              type="number"
              min={0}
              step={5}
              defaultValue={service?.buffer_after_minutes ?? 0}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="service-pricing">
        <h3 id="service-pricing" className="text-sm font-semibold">
          Pricing
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              step={0.01}
              defaultValue={service?.price ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_rate_bps">Tax rate (bps)</Label>
            <Input
              id="tax_rate_bps"
              name="tax_rate_bps"
              type="number"
              min={0}
              step={1}
              defaultValue={service?.tax_rate_bps ?? 0}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="taxable"
            value="on"
            defaultChecked={service?.taxable ?? true}
          />
          Taxable
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="deposit_required"
            value="on"
            checked={depositRequired}
            onChange={(event) => setDepositRequired(event.target.checked)}
          />
          Deposit required
        </label>
        {depositRequired && (
          <div className="space-y-2">
            <Label htmlFor="deposit_amount">Deposit amount ($)</Label>
            <Input
              id="deposit_amount"
              name="deposit_amount"
              type="number"
              min={0}
              step={0.01}
              defaultValue={centsToDollars(service?.deposit_cents)}
              required
            />
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="service-booking">
        <h3 id="service-booking" className="text-sm font-semibold">
          Online booking
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="booking_visibility">Visibility</Label>
            <Select
              id="booking_visibility"
              name="booking_visibility"
              defaultValue={
                service?.booking_visibility ??
                (service?.online_booking === false ? "hidden" : "online")
              }
            >
              <option value="online">Visible online</option>
              <option value="hidden">Hidden</option>
              <option value="internal">Internal only</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmation_mode">Confirmation</Label>
            <Select
              id="confirmation_mode"
              name="confirmation_mode"
              defaultValue={service?.confirmation_mode ?? "inherit"}
            >
              <option value="inherit">Inherit business default</option>
              <option value="auto_confirm">Auto-confirm</option>
              <option value="require_approval">Require approval</option>
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="online_payment_required"
            value="on"
            defaultChecked={service?.online_payment_required ?? false}
          />
          Online payment required (future)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            value="on"
            defaultChecked={service?.is_active ?? true}
          />
          Active
        </label>
      </section>

      <section className="space-y-4" aria-labelledby="service-availability">
        <h3 id="service-availability" className="text-sm font-semibold">
          Availability rules
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="max_appointments_per_day">Max / day</Label>
            <Input
              id="max_appointments_per_day"
              name="max_appointments_per_day"
              type="number"
              min={1}
              defaultValue={service?.max_appointments_per_day ?? ""}
              placeholder="Unlimited"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_booking_notice_minutes">Min notice (min)</Label>
            <Input
              id="min_booking_notice_minutes"
              name="min_booking_notice_minutes"
              type="number"
              min={0}
              defaultValue={service?.min_booking_notice_minutes ?? ""}
              placeholder="Business default"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_booking_days_ahead">Book ahead (days)</Label>
            <Input
              id="max_booking_days_ahead"
              name="max_booking_days_ahead"
              type="number"
              min={1}
              defaultValue={service?.max_booking_days_ahead ?? ""}
              placeholder="Business default"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="service-locations">
        <h3 id="service-locations" className="text-sm font-semibold">
          Locations
        </h3>
        <div className="space-y-2">
          <Label htmlFor="primary_location_id">Primary location</Label>
          <Select
            id="primary_location_id"
            name="primary_location_id"
            defaultValue={
              service?.location_id ?? locations[0]?.id ?? ""
            }
            required
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Also offered at</legend>
          {locations.map((location) => (
            <label
              key={location.id}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                name="location_ids"
                value={location.id}
                defaultChecked={
                  locationIds.includes(location.id) ||
                  location.id === service?.location_id
                }
              />
              {location.name}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="space-y-4" aria-labelledby="service-staff">
        <h3 id="service-staff" className="text-sm font-semibold">
          Employees
        </h3>
        {loadingMeta ? (
          <p className="text-sm text-muted-foreground">Loading assignments…</p>
        ) : staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No employees yet. Add employees to assign this service.
          </p>
        ) : (
          <ul className="space-y-3">
            {staff
              .filter((member) => member.is_active)
              .map((member) => {
                const assignment = assignments.find(
                  (row) => row.staff_id === member.id,
                );
                return (
                  <li
                    key={member.id}
                    className="grid gap-2 rounded-[var(--radius-sm)] border border-border/60 p-3 sm:grid-cols-[1fr_8rem]"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="staff_ids"
                        value={member.id}
                        defaultChecked={Boolean(assignment)}
                      />
                      {member.name}
                      {member.title ? (
                        <span className="text-muted-foreground">
                          · {member.title}
                        </span>
                      ) : null}
                    </label>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`price_override_${member.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        Price override ($)
                      </Label>
                      <Input
                        id={`price_override_${member.id}`}
                        name={`price_override_${member.id}`}
                        type="number"
                        min={0}
                        step={0.01}
                        defaultValue={
                          assignment?.price_override != null
                            ? Number(assignment.price_override)
                            : ""
                        }
                        placeholder="Default"
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="service-notes">
        <h3 id="service-notes" className="text-sm font-semibold">
          Notes & policies
        </h3>
        <div className="space-y-2">
          <Label htmlFor="preparation_instructions">
            Preparation instructions
          </Label>
          <Textarea
            id="preparation_instructions"
            name="preparation_instructions"
            rows={3}
            defaultValue={service?.preparation_instructions ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cancellation_policy">Cancellation policy</Label>
          <Textarea
            id="cancellation_policy"
            name="cancellation_policy"
            rows={2}
            defaultValue={service?.cancellation_policy ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internal_notes">Internal notes</Label>
          <Textarea
            id="internal_notes"
            name="internal_notes"
            rows={2}
            defaultValue={service?.internal_notes ?? ""}
          />
        </div>
      </section>

      <AlertMessage error={state.error} />
      <FormFooter
        onCancel={onClose}
        pending={pending}
        submitLabel={service ? "Update" : "Create"}
      />
    </form>
  );

  return (
    <div className="space-y-6">
      {form}
      {service && (
        <section className="space-y-4 border-t border-border pt-4" aria-labelledby="service-blackouts">
          <h3 id="service-blackouts" className="text-sm font-semibold">
            Blackout periods
          </h3>
          {blackouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No blackouts configured for this service.
            </p>
          ) : (
            <ul className="space-y-2">
              {blackouts.map((blackout) => (
                <li
                  key={blackout.id}
                  className="flex items-start justify-between gap-2 rounded-[var(--radius-sm)] border border-border/60 px-3 py-2 text-sm"
                >
                  <div>
                    <p>
                      {new Date(blackout.starts_at).toLocaleString()} →{" "}
                      {new Date(blackout.ends_at).toLocaleString()}
                    </p>
                    {blackout.reason ? (
                      <p className="text-muted-foreground">{blackout.reason}</p>
                    ) : null}
                  </div>
                  <IconButton
                    label="Delete blackout"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteBlackout(blackout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
          <form action={blackoutAction} className="space-y-3 rounded-[var(--radius-sm)] border border-dashed border-border p-3">
            <input type="hidden" name="service_id" value={service.id} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Starts</Label>
                <Input
                  id="starts_at"
                  name="starts_at"
                  type="datetime-local"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">Ends</Label>
                <Input
                  id="ends_at"
                  name="ends_at"
                  type="datetime-local"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" name="reason" placeholder="Optional" />
            </div>
            <AlertMessage error={blackoutState.error} />
            <Button type="submit" disabled={blackoutPending} variant="outline">
              {blackoutPending ? "Saving…" : "Add blackout"}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}

export function ServicesManager({
  services,
  categories,
  staff,
  locations,
}: {
  services: Service[];
  categories: ServiceCategory[];
  staff: Pick<Staff, "id" | "name" | "title" | "is_active" | "location_id" | "color">[];
  locations: Location[];
}) {
  const [tab, setTab] = useState<TabKey>("catalog");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | undefined>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "online" | "hidden" | "internal"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [page, setPage] = useState(1);
  const refresh = useRefresh();
  const { toast } = useToast();

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStatusFilter(value: typeof statusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function updateVisibilityFilter(value: typeof visibilityFilter) {
    setVisibilityFilter(value);
    setPage(1);
  }

  function updateCategoryFilter(value: string) {
    setCategoryFilter(value);
    setPage(1);
  }

  function updateSortKey(value: SortKey) {
    setSortKey(value);
    setPage(1);
  }

  async function handleDelete(id: string, name: string) {
    if (!(await confirmDelete(`Delete ${name}?`))) return;
    const result = await deleteService(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(result.success ?? "Service deleted.", "success");
      refresh();
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = services.filter((service) => {
      const visibility =
        service.booking_visibility ??
        (service.online_booking === false ? "hidden" : "online");
      if (statusFilter === "active" && !service.is_active) return false;
      if (statusFilter === "inactive" && service.is_active) return false;
      if (visibilityFilter !== "all" && visibility !== visibilityFilter) {
        return false;
      }
      if (
        categoryFilter !== "all" &&
        service.category_id !== categoryFilter &&
        service.category !==
          categories.find((c) => c.id === categoryFilter)?.name
      ) {
        return false;
      }
      if (!query) return true;
      return (
        service.name.toLowerCase().includes(query) ||
        (service.description ?? "").toLowerCase().includes(query) ||
        (service.category ?? "").toLowerCase().includes(query)
      );
    });

    rows = [...rows].sort((a, b) => {
      if (sortKey === "price") return Number(a.price) - Number(b.price);
      if (sortKey === "duration") {
        return a.duration_minutes - b.duration_minutes;
      }
      if (sortKey === "order") {
        return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [
    services,
    search,
    statusFilter,
    visibilityFilter,
    categoryFilter,
    categories,
    sortKey,
  ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto">
        {(
          [
            ["catalog", "Services"],
            ["categories", "Categories"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        <ServiceCategoriesPanel categories={categories} />
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="relative sm:col-span-2 xl:col-span-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder="Search services…"
                  className="pl-9"
                  aria-label="Search services"
                />
              </div>
              <Select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) =>
                  updateStatusFilter(event.target.value as typeof statusFilter)
                }
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Select
                aria-label="Filter by visibility"
                value={visibilityFilter}
                onChange={(event) =>
                  updateVisibilityFilter(
                    event.target.value as typeof visibilityFilter,
                  )
                }
              >
                <option value="all">All visibility</option>
                <option value="online">Online</option>
                <option value="hidden">Hidden</option>
                <option value="internal">Internal</option>
              </Select>
              <Select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(event) => updateCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Sort services"
                value={sortKey}
                onChange={(event) =>
                  updateSortKey(event.target.value as SortKey)
                }
                className="w-40"
              >
                <option value="order">Display order</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="duration">Duration</option>
              </Select>
              <Button
                onClick={() => {
                  setEditing(undefined);
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Add service
              </Button>
            </div>
          </div>

          {pageRows.length === 0 ? (
            <EmptyState
              title={services.length === 0 ? "No services yet" : "No matches"}
              description={
                services.length === 0
                  ? "Create your first service to start accepting bookings."
                  : "Try adjusting search or filters."
              }
            >
              {services.length === 0 && (
                <Button
                  onClick={() => {
                    setEditing(undefined);
                    setOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add service
                </Button>
              )}
            </EmptyState>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pageRows.map((service) => {
                  const visibility =
                    service.booking_visibility ??
                    (service.online_booking === false ? "hidden" : "online");
                  return (
                    <Card key={service.id} className="ds-card-interactive">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: service.color }}
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold">
                                {service.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {service.category ?? "Uncategorized"} ·{" "}
                                {service.duration_minutes} min · $
                                {Number(service.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <IconButton
                              label={`Edit ${service.name}`}
                              onClick={() => {
                                setEditing(service);
                                setOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                            <IconButton
                              label={`Delete ${service.name}`}
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                handleDelete(service.id, service.name)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          </div>
                        </div>
                        {service.description ? (
                          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-md bg-muted px-2 py-0.5 capitalize">
                            {visibility}
                          </span>
                          {(service.buffer_before_minutes > 0 ||
                            service.buffer_after_minutes > 0) && (
                            <span className="rounded-md bg-muted px-2 py-0.5">
                              Buffer {service.buffer_before_minutes}/
                              {service.buffer_after_minutes} min
                            </span>
                          )}
                          {(service.cleanup_minutes ?? 0) > 0 && (
                            <span className="rounded-md bg-muted px-2 py-0.5">
                              Cleanup {service.cleanup_minutes} min
                            </span>
                          )}
                          {service.deposit_required ||
                          (service.deposit_cents ?? 0) > 0 ? (
                            <span className="rounded-md bg-muted px-2 py-0.5">
                              Deposit
                            </span>
                          ) : null}
                          {!service.is_active && (
                            <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-destructive">
                              Inactive
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span>
                    Page {currentPage} / {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage >= pageCount}
                    onClick={() =>
                      setPage((p) => Math.min(pageCount, p + 1))
                    }
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit service" : "New service"}
        className="sm:max-w-2xl"
      >
        <ServiceForm
          service={editing}
          categories={categories}
          staff={staff}
          locations={locations}
          onClose={() => setOpen(false)}
        />
      </Dialog>
    </div>
  );
}
