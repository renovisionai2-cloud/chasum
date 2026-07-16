"use client";

import { EmployeeActivityTimeline } from "@/components/employees/employee-activity-timeline";
import { EmployeeDocumentsPanel } from "@/components/employees/employee-documents-panel";
import { EmployeePerformanceDashboard } from "@/components/employees/employee-performance";
import { StaffScheduleDialog } from "@/components/staff/staff-schedule-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addEmployeeNoteAction,
  updateEmployeeProfile,
} from "@/lib/actions/employees";
import {
  ALL_PERMISSIONS,
  EMPLOYMENT_STATUS_LABELS,
  PAY_TYPE_LABELS,
  PERMISSION_LABELS,
  ROLE_DEFINITIONS,
  type EmployeeRoleKey,
} from "@/lib/employees/roles";
import type { Department, EmployeeProfile } from "@/lib/employees/types";
import type { ActionState, Location, Service } from "@/lib/types/booking";
import { DAY_NAMES, STAFF_COLORS } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { format } from "date-fns";
import {
  CalendarClock,
  Clock3,
  MapPin,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { useActionState, useMemo, useState } from "react";

type TabKey =
  | "overview"
  | "role"
  | "schedule"
  | "assignments"
  | "payroll"
  | "documents"
  | "performance"
  | "activity"
  | "notes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "role", label: "Roles & permissions" },
  { key: "schedule", label: "Hours & time off" },
  { key: "assignments", label: "Services & locations" },
  { key: "payroll", label: "Payroll" },
  { key: "documents", label: "Documents" },
  { key: "performance", label: "Performance" },
  { key: "activity", label: "Activity" },
  { key: "notes", label: "Notes" },
];

function dollarsFromCents(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function percentFromBps(bps: number | null | undefined) {
  if (bps == null) return "";
  return (bps / 100).toFixed(2);
}

export function EmployeeProfileView({
  employee,
  services,
  locations,
  departments,
}: {
  employee: EmployeeProfile;
  services: Service[];
  locations: Location[];
  departments: Department[];
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [roleKey, setRoleKey] = useState<EmployeeRoleKey>(employee.role_key);
  const [state, formAction, pending] = useActionState(
    updateEmployeeProfile,
    {} as ActionState,
  );
  const [noteState, noteAction, notePending] = useActionState(
    addEmployeeNoteAction,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, () => refresh());
  useFormAction(noteState, () => refresh());

  const defaultPermissions = useMemo(
    () =>
      employee.permissions.length > 0
        ? employee.permissions
        : ROLE_DEFINITIONS[employee.role_key].permissions,
    [employee],
  );

  const assignedLocationIds = employee.staff_locations.map((l) => l.location_id);
  const assignedServiceIds = employee.staff_services.map((s) => s.service_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div
            className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:mx-0"
            style={{ boxShadow: `inset 0 0 0 3px ${employee.color}` }}
          >
            {employee.photo_url ? (
              <Image
                src={employee.photo_url}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-semibold text-muted-foreground">
                {employee.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
            <h2 className="truncate text-xl font-semibold tracking-tight">
              {employee.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {employee.title || "Team member"}
              {employee.department?.name ? ` · ${employee.department.name}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {ROLE_DEFINITIONS[employee.role_key].label} ·{" "}
              {EMPLOYMENT_STATUS_LABELS[employee.employment_status]}
              {employee.location?.name ? ` · ${employee.location.name}` : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setScheduleOpen(true)}
          >
            <CalendarClock className="h-4 w-4" />
            Edit schedule
          </Button>
        </CardContent>
      </Card>

      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "performance" ? (
        <EmployeePerformanceDashboard performance={employee.performance} />
      ) : null}

      {tab === "documents" ? (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeDocumentsPanel
              staffId={employee.id}
              documents={employee.documents}
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === "activity" ? (
        <Card>
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeActivityTimeline events={employee.activity} />
          </CardContent>
        </Card>
      ) : null}

      {tab === "schedule" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="h-4 w-4" /> Working hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employee.hours.length === 0 ? (
                <EmptyState
                  variant="inline"
                  glyph={Clock3}
                  title="No hours configured"
                  description="Use Edit schedule to set weekly working hours."
                />
              ) : (
                <ul className="space-y-2 text-sm">
                  {employee.hours.map((hour) => (
                    <li
                      key={hour.id}
                      className="flex items-center justify-between gap-2 border-b border-border/60 py-2 last:border-0"
                    >
                      <span>{DAY_NAMES[hour.day_of_week] ?? `Day ${hour.day_of_week}`}</span>
                      <span className="text-muted-foreground">
                        {hour.is_working
                          ? `${hour.start_time.slice(0, 5)} – ${hour.end_time.slice(0, 5)}`
                          : "Off"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vacation & time off</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.vacations.length === 0 ? (
                <EmptyState
                  variant="inline"
                  glyph={CalendarClock}
                  title="No time off recorded"
                  description="Add vacations from the schedule editor."
                />
              ) : (
                <ul className="space-y-2 text-sm">
                  {employee.vacations.map((vacation) => (
                    <li key={vacation.id} className="border-b border-border/60 py-2 last:border-0">
                      <p className="font-medium">
                        {vacation.start_date} → {vacation.end_date}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vacation.reason || "Time off"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Availability blocks</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.availabilityBlocks.length === 0 ? (
                <EmptyState
                  variant="inline"
                  glyph={MapPin}
                  title="No availability overrides"
                  description="Custom availability blocks for this employee will appear here."
                />
              ) : (
                <ul className="divide-y divide-border/80 text-sm">
                  {employee.availabilityBlocks.map((block) => (
                    <li key={block.id} className="py-2">
                      <p className="font-medium">
                        {format(new Date(block.start_time), "MMM d, yyyy h:mm a")} –{" "}
                        {format(new Date(block.end_time), "h:mm a")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {block.is_available ? "Available" : "Blocked"}
                        {block.notes ? ` · ${block.notes}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "notes" ? (
        <Card>
          <CardHeader>
            <CardTitle>Internal notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.notes ? (
              <pre className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                {employee.notes}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
            <form action={noteAction} className="space-y-3">
              <input type="hidden" name="staff_id" value={employee.id} />
              <Label htmlFor="employee_note">Add note</Label>
              <Textarea id="employee_note" name="note" rows={3} required />
              <AlertMessage error={noteState.error} success={noteState.success} />
              <Button type="submit" size="sm" disabled={notePending}>
                {notePending ? "Saving…" : "Save note"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {(tab === "overview" ||
        tab === "role" ||
        tab === "assignments" ||
        tab === "payroll") && (
        <Card>
          <CardHeader>
            <CardTitle>
              {tab === "overview" && "Contact & employment"}
              {tab === "role" && "Roles & permissions"}
              {tab === "assignments" && "Assigned services & locations"}
              {tab === "payroll" && "Payroll & commission"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-5">
              <input type="hidden" name="id" value={employee.id} />

              {tab === "overview" ? (
                <>
                  <ImageUploadField
                    id="photo_url"
                    name="photo_url"
                    label="Photo"
                    folder="staff-photos"
                    defaultValue={employee.photo_url}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" defaultValue={employee.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Job title</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={employee.title ?? ""}
                        placeholder="Stylist, Technician, Coach…"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={employee.email ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={employee.phone ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department_id">Department</Label>
                      <Select
                        id="department_id"
                        name="department_id"
                        defaultValue={employee.department_id ?? ""}
                      >
                        <option value="">Unassigned</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employment_status">Employment status</Label>
                      <Select
                        id="employment_status"
                        name="employment_status"
                        defaultValue={employee.employment_status}
                      >
                        {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hire_date">Hire date</Label>
                      <Input
                        id="hire_date"
                        name="hire_date"
                        type="date"
                        defaultValue={employee.hire_date ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="is_active">Active for booking</Label>
                      <Select
                        id="is_active"
                        name="is_active"
                        defaultValue={employee.is_active ? "true" : "false"}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
                    <p className="ds-label">Emergency contact</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Name</Label>
                        <Input
                          id="emergency_contact_name"
                          name="emergency_contact_name"
                          defaultValue={employee.emergency_contact_name ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Phone</Label>
                        <Input
                          id="emergency_contact_phone"
                          name="emergency_contact_phone"
                          defaultValue={employee.emergency_contact_phone ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_relationship">
                          Relationship
                        </Label>
                        <Input
                          id="emergency_contact_relationship"
                          name="emergency_contact_relationship"
                          defaultValue={employee.emergency_contact_relationship ?? ""}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Calendar color</Label>
                    <ColorPicker
                      name="color"
                      colors={STAFF_COLORS}
                      defaultValue={employee.color}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biography">Biography</Label>
                    <Textarea
                      id="biography"
                      name="biography"
                      rows={3}
                      defaultValue={employee.biography ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Textarea
                      id="qualifications"
                      name="qualifications"
                      rows={2}
                      defaultValue={employee.qualifications ?? ""}
                    />
                  </div>
                  <input type="hidden" name="role_key" value={employee.role_key} />
                  <input type="hidden" name="pay_type" value={employee.pay_type} />
                  <input
                    type="hidden"
                    name="location_id"
                    value={employee.location_id}
                  />
                  {assignedLocationIds.map((id) => (
                    <input key={id} type="hidden" name="location_ids" value={id} />
                  ))}
                  {assignedServiceIds.map((id) => (
                    <input key={id} type="hidden" name="service_ids" value={id} />
                  ))}
                  {defaultPermissions.map((perm) => (
                    <input key={perm} type="hidden" name="permissions" value={perm} />
                  ))}
                </>
              ) : null}

              {tab === "role" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="role_key">Role</Label>
                    <Select
                      id="role_key"
                      name="role_key"
                      value={roleKey}
                      onChange={(e) => setRoleKey(e.target.value as EmployeeRoleKey)}
                    >
                      {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
                        <option key={key} value={key}>
                          {def.label}
                        </option>
                      ))}
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_DEFINITIONS[roleKey].description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="ds-label flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" /> Permissions
                    </p>
                    <div key={roleKey} className="grid gap-2 sm:grid-cols-2">
                      {ALL_PERMISSIONS.map((perm) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border/80 px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name="permissions"
                            value={perm}
                            defaultChecked={ROLE_DEFINITIONS[roleKey].permissions.includes(
                              perm,
                            )}
                          />
                          {PERMISSION_LABELS[perm]}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stored now for role-based authorization; enforced when multi-staff login ships.
                    </p>
                  </div>
                  <input type="hidden" name="name" value={employee.name} />
                  <input type="hidden" name="email" value={employee.email ?? ""} />
                  <input type="hidden" name="phone" value={employee.phone ?? ""} />
                  <input type="hidden" name="title" value={employee.title ?? ""} />
                  <input type="hidden" name="photo_url" value={employee.photo_url ?? ""} />
                  <input type="hidden" name="color" value={employee.color} />
                  <input type="hidden" name="location_id" value={employee.location_id} />
                  <input
                    type="hidden"
                    name="department_id"
                    value={employee.department_id ?? ""}
                  />
                  <input
                    type="hidden"
                    name="employment_status"
                    value={employee.employment_status}
                  />
                  <input type="hidden" name="is_active" value={employee.is_active ? "true" : "false"} />
                  <input type="hidden" name="pay_type" value={employee.pay_type} />
                  {assignedLocationIds.map((id) => (
                    <input key={id} type="hidden" name="location_ids" value={id} />
                  ))}
                  {assignedServiceIds.map((id) => (
                    <input key={id} type="hidden" name="service_ids" value={id} />
                  ))}
                </>
              ) : null}

              {tab === "assignments" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="location_id">Primary location</Label>
                    <Select
                      id="location_id"
                      name="location_id"
                      defaultValue={employee.location_id}
                      required
                    >
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="ds-label">Assigned locations</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {locations.map((location) => (
                        <label
                          key={location.id}
                          className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border/80 px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name="location_ids"
                            value={location.id}
                            defaultChecked={
                              assignedLocationIds.includes(location.id) ||
                              location.id === employee.location_id
                            }
                          />
                          {location.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="ds-label">Assigned services</p>
                    <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                      {services.map((service) => (
                        <label
                          key={service.id}
                          className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border/80 px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name="service_ids"
                            value={service.id}
                            defaultChecked={assignedServiceIds.includes(service.id)}
                          />
                          {service.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <input type="hidden" name="name" value={employee.name} />
                  <input type="hidden" name="role_key" value={employee.role_key} />
                  <input type="hidden" name="pay_type" value={employee.pay_type} />
                  <input
                    type="hidden"
                    name="employment_status"
                    value={employee.employment_status}
                  />
                  <input type="hidden" name="is_active" value={employee.is_active ? "true" : "false"} />
                  <input type="hidden" name="color" value={employee.color} />
                  {defaultPermissions.map((perm) => (
                    <input key={perm} type="hidden" name="permissions" value={perm} />
                  ))}
                </>
              ) : null}

              {tab === "payroll" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pay_type">Pay type</Label>
                      <Select
                        id="pay_type"
                        name="pay_type"
                        defaultValue={employee.pay_type}
                      >
                        {Object.entries(PAY_TYPE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate">Hourly rate (USD)</Label>
                      <Input
                        id="hourly_rate"
                        name="hourly_rate"
                        inputMode="decimal"
                        placeholder="25.00"
                        defaultValue={dollarsFromCents(employee.hourly_rate_cents)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary">Annual salary (USD)</Label>
                      <Input
                        id="salary"
                        name="salary"
                        inputMode="decimal"
                        placeholder="52000"
                        defaultValue={dollarsFromCents(employee.salary_cents)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commission_rate">Commission (%)</Label>
                      <Input
                        id="commission_rate"
                        name="commission_rate"
                        inputMode="decimal"
                        placeholder="15"
                        defaultValue={percentFromBps(employee.commission_rate_bps)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payroll_notes">Payroll notes</Label>
                    <Textarea
                      id="payroll_notes"
                      name="payroll_notes"
                      rows={3}
                      defaultValue={employee.payroll_notes ?? ""}
                      placeholder="Future payroll provider fields, tax setup, etc."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payroll data is stored for owners now and ready for payroll providers, AI Workforce, and mobile time clock.
                  </p>
                  <input type="hidden" name="name" value={employee.name} />
                  <input type="hidden" name="role_key" value={employee.role_key} />
                  <input type="hidden" name="location_id" value={employee.location_id} />
                  <input
                    type="hidden"
                    name="employment_status"
                    value={employee.employment_status}
                  />
                  <input type="hidden" name="is_active" value={employee.is_active ? "true" : "false"} />
                  <input type="hidden" name="color" value={employee.color} />
                  {assignedLocationIds.map((id) => (
                    <input key={id} type="hidden" name="location_ids" value={id} />
                  ))}
                  {assignedServiceIds.map((id) => (
                    <input key={id} type="hidden" name="service_ids" value={id} />
                  ))}
                  {defaultPermissions.map((perm) => (
                    <input key={perm} type="hidden" name="permissions" value={perm} />
                  ))}
                </>
              ) : null}

              <AlertMessage error={state.error} success={state.success} />
              <FormFooter pending={pending} submitLabel="Save changes" />
            </form>
          </CardContent>
        </Card>
      )}

      <StaffScheduleDialog
        open={scheduleOpen}
        onClose={() => {
          setScheduleOpen(false);
          refresh();
        }}
        staff={{
          id: employee.id,
          business_id: employee.business_id,
          location_id: employee.location_id,
          name: employee.name,
          email: employee.email,
          title: employee.title,
          photo_url: employee.photo_url,
          biography: employee.biography,
          qualifications: employee.qualifications,
          color: employee.color,
          is_active: employee.is_active,
          created_at: employee.created_at,
          updated_at: employee.updated_at,
        }}
        workingHours={employee.hours}
        vacations={employee.vacations}
      />
    </div>
  );
}
