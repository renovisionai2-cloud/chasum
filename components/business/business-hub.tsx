"use client";

import { AiSettingsPanel } from "@/components/business/ai-settings-panel";
import { BookingSettingsPanel } from "@/components/business/booking-settings-panel";
import { BrandingSettingsPanel } from "@/components/business/branding-settings-panel";
import { BusinessDocumentsPanel } from "@/components/business/business-documents-panel";
import { HoursSettingsPanel } from "@/components/business/hours-settings-panel";
import { NotificationSettingsPanel } from "@/components/business/notification-settings-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createGiftCard,
  deleteAutomationRule,
  deleteBookingResource,
  deleteDiscountCode,
  deleteFormTemplate,
  deleteMembership,
  deletePackage,
  deleteServiceCategory,
  deleteTaxRate,
  redeemGiftCard,
  updateBusinessManagementProfile,
  upsertAutomationRule,
  upsertBookingResource,
  upsertDiscountCode,
  upsertFormTemplate,
  upsertMembership,
  upsertPackage,
  upsertServiceCategory,
  upsertTaxRate,
} from "@/lib/actions/business-management";
import { BUSINESS_INDUSTRIES } from "@/lib/business/types";
import {
  BUSINESS_LANGUAGES,
  BUSINESS_TYPES,
  type BusinessClosure,
  type BusinessDocument,
} from "@/lib/business/settings";
import type {
  BusinessAutomationRule,
  CustomFormTemplate,
  DiscountCode,
  GiftCard,
  Membership,
  ServiceCategory,
  ServicePackage,
  TaxRate,
} from "@/lib/business/types";
import type { BookingResource } from "@/lib/booking-engine/types";
import type {
  ActionState,
  Business,
  Holiday,
  Location,
  LocationHours,
  Service,
} from "@/lib/types/booking";
import { TIMEZONES } from "@/lib/constants";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  Gift,
  Layers,
  MapPin,
  Package,
  Palette,
  Percent,
  Settings2,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";

type TabKey =
  | "profile"
  | "hours"
  | "booking"
  | "branding"
  | "notifications"
  | "ai"
  | "documents"
  | "locations"
  | "services"
  | "categories"
  | "rooms"
  | "memberships"
  | "packages"
  | "giftcards"
  | "taxes"
  | "discounts"
  | "forms"
  | "automation";

const TABS: { key: TabKey; label: string; icon: typeof Building2 }[] = [
  { key: "profile", label: "Profile", icon: Building2 },
  { key: "hours", label: "Hours", icon: CalendarClock },
  { key: "booking", label: "Booking", icon: Settings2 },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "ai", label: "AI", icon: Sparkles },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "locations", label: "Locations", icon: MapPin },
  { key: "services", label: "Services", icon: Layers },
  { key: "categories", label: "Categories", icon: Tag },
  { key: "rooms", label: "Rooms & resources", icon: Settings2 },
  { key: "memberships", label: "Memberships", icon: Wallet },
  { key: "packages", label: "Packages", icon: Package },
  { key: "giftcards", label: "Gift cards", icon: Gift },
  { key: "taxes", label: "Taxes", icon: Percent },
  { key: "discounts", label: "Discounts", icon: Percent },
  { key: "forms", label: "Custom forms", icon: ClipboardList },
  { key: "automation", label: "Automation", icon: Sparkles },
];

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function CatalogList({
  emptyTitle,
  emptyDescription,
  items,
  onDelete,
}: {
  emptyTitle: string;
  emptyDescription: string;
  items: { id: string; title: string; subtitle?: string }[];
  onDelete?: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        variant="panel"
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }
  return (
    <ul className="divide-y divide-border/80 rounded-[var(--radius-md)] border border-border">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 px-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.title}</p>
            {item.subtitle ? (
              <p className="truncate text-xs text-muted-foreground">
                {item.subtitle}
              </p>
            ) : null}
          </div>
          {onDelete ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => onDelete(item.id)}
            >
              Delete
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function BusinessHub({
  business,
  locations,
  services,
  categories,
  resources,
  memberships,
  packages,
  giftCards,
  taxRates,
  discounts,
  forms,
  automationRules,
  hours,
  holidays,
  closures,
  documents,
}: {
  business: Business;
  locations: Location[];
  services: Service[];
  categories: ServiceCategory[];
  resources: BookingResource[];
  memberships: Membership[];
  packages: ServicePackage[];
  giftCards: GiftCard[];
  taxRates: TaxRate[];
  discounts: DiscountCode[];
  forms: CustomFormTemplate[];
  automationRules: BusinessAutomationRule[];
  hours: LocationHours[];
  holidays: Holiday[];
  closures: BusinessClosure[];
  documents: BusinessDocument[];
}) {
  const [tab, setTab] = useState<TabKey>("profile");
  const refresh = useRefresh();
  const { toast } = useToast();
  const [deleting, startDelete] = useTransition();

  const [profileState, profileAction, profilePending] = useActionState(
    updateBusinessManagementProfile,
    {} as ActionState,
  );
  const [catState, catAction, catPending] = useActionState(
    upsertServiceCategory,
    {} as ActionState,
  );
  const [resState, resAction, resPending] = useActionState(
    upsertBookingResource,
    {} as ActionState,
  );
  const [memState, memAction, memPending] = useActionState(
    upsertMembership,
    {} as ActionState,
  );
  const [pkgState, pkgAction, pkgPending] = useActionState(
    upsertPackage,
    {} as ActionState,
  );
  const [gcState, gcAction, gcPending] = useActionState(
    createGiftCard,
    {} as ActionState,
  );
  const [redeemState, redeemAction, redeemPending] = useActionState(
    redeemGiftCard,
    {} as ActionState,
  );
  const [taxState, taxAction, taxPending] = useActionState(
    upsertTaxRate,
    {} as ActionState,
  );
  const [discState, discAction, discPending] = useActionState(
    upsertDiscountCode,
    {} as ActionState,
  );
  const [formState, formAction, formPending] = useActionState(
    upsertFormTemplate,
    {} as ActionState,
  );
  const [ruleState, ruleAction, rulePending] = useActionState(
    upsertAutomationRule,
    {} as ActionState,
  );

  useFormAction(profileState, () => refresh());
  useFormAction(catState, () => refresh());
  useFormAction(resState, () => refresh());
  useFormAction(memState, () => refresh());
  useFormAction(pkgState, () => refresh());
  useFormAction(gcState, () => refresh());
  useFormAction(redeemState, () => refresh());
  useFormAction(taxState, () => refresh());
  useFormAction(discState, () => refresh());
  useFormAction(formState, () => refresh());
  useFormAction(ruleState, () => refresh());

  function remove(
    label: string,
    fn: (id: string) => Promise<ActionState>,
    id: string,
  ) {
    startDelete(async () => {
      if (!(await confirmDelete(`Delete ${label}?`))) return;
      const result = await fn(id);
      if (result.error) toast(result.error, "error");
      else {
        toast(result.success ?? "Deleted.", "success");
        refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === item.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" ? (
        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Customers see your business name and booking slug on the public
              booking page.
            </p>
          </CardHeader>
          <CardContent>
            <form action={profileAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUploadField
                  id="logo_url"
                  name="logo_url"
                  label="Logo"
                  folder="logo"
                  defaultValue={business.logo_url}
                />
                <ImageUploadField
                  id="cover_url"
                  name="cover_url"
                  label="Cover image"
                  folder="cover"
                  defaultValue={business.cover_url}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Business name</Label>
                  <Input id="name" name="name" defaultValue={business.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_name">Legal name</Label>
                  <Input
                    id="legal_name"
                    name="legal_name"
                    defaultValue={business.legal_name ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Booking slug</Label>
                  <Input id="slug" name="slug" defaultValue={business.slug} required />
                  <p className="text-xs text-muted-foreground">
                    Letters, numbers, and hyphens only. Public link:{" "}
                    <span className="font-mono">/book/{business.slug || "your-slug"}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business type</Label>
                  <Select
                    id="business_type"
                    name="business_type"
                    defaultValue={business.business_type ?? ""}
                  >
                    <option value="">Select type</option>
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={business.description ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    id="industry"
                    name="industry"
                    defaultValue={business.industry ?? ""}
                  >
                    <option value="">Select industry</option>
                    {BUSINESS_INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    id="language"
                    name="language"
                    defaultValue={business.language ?? "en"}
                  >
                    {BUSINESS_LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    defaultValue={business.website ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={business.email ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={business.phone ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_number">Tax number</Label>
                  <Input
                    id="tax_number"
                    name="tax_number"
                    defaultValue={business.tax_number ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    id="currency"
                    name="currency"
                    defaultValue={business.currency ?? "usd"}
                  >
                    <option value="usd">USD</option>
                    <option value="cad">CAD</option>
                    <option value="eur">EUR</option>
                    <option value="gbp">GBP</option>
                    <option value="aud">AUD</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Time zone</Label>
                  <Select
                    id="timezone"
                    name="timezone"
                    defaultValue={business.timezone}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="address_line1"
                  placeholder="Address line 1"
                  defaultValue={business.address_line1 ?? ""}
                />
                <Input
                  name="address_line2"
                  placeholder="Address line 2"
                  defaultValue={business.address_line2 ?? ""}
                />
                <Input name="city" placeholder="City" defaultValue={business.city ?? ""} />
                <Input name="state" placeholder="State / province" defaultValue={business.state ?? ""} />
                <Input
                  name="postal_code"
                  placeholder="Postal code"
                  defaultValue={business.postal_code ?? ""}
                />
                <Input
                  name="country"
                  placeholder="Country"
                  defaultValue={business.country ?? ""}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="social_instagram"
                  placeholder="Instagram URL"
                  defaultValue={business.social_links?.instagram ?? ""}
                />
                <Input
                  name="social_facebook"
                  placeholder="Facebook URL"
                  defaultValue={business.social_links?.facebook ?? ""}
                />
                <Input
                  name="social_tiktok"
                  placeholder="TikTok URL"
                  defaultValue={business.social_links?.tiktok ?? ""}
                />
                <Input
                  name="social_youtube"
                  placeholder="YouTube URL"
                  defaultValue={business.social_links?.youtube ?? ""}
                />
                <Input
                  name="social_twitter"
                  placeholder="X / Twitter URL"
                  defaultValue={business.social_links?.twitter ?? ""}
                />
              </div>
              <AlertMessage error={profileState.error} success={profileState.success} />
              <FormFooter pending={profilePending} submitLabel="Save profile" />
            </form>
          </CardContent>
        </Card>
      ) : null}

      {tab === "locations" ? (
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Unlimited locations for single-site, multi-site, and enterprise
              tenants. Manage hours, employees, rooms, and services per location.
            </p>
            <ul className="divide-y divide-border/80 rounded-[var(--radius-md)] border border-border">
              {locations.map((location) => (
                <li key={location.id} className="px-3 py-2.5 text-sm">
                  <p className="font-medium">{location.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[location.address_line1, location.city, location.state]
                      .filter(Boolean)
                      .join(", ") || "No address yet"}
                    {location.phone ? ` · ${location.phone}` : ""}
                    {location.is_default ? " · Default" : ""}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/settings">
                <Button size="sm" variant="outline">
                  Location hours & scheduling
                </Button>
              </Link>
              <Link href="/dashboard/employees">
                <Button size="sm" variant="outline">
                  Assign employees
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "services" ? (
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Duration, price, buffers, online booking, and policies are managed
              in Services. Categories, deposits, and images are extended here.
            </p>
            <p className="text-sm">
              {services.length} service{services.length === 1 ? "" : "s"} configured.
            </p>
            <Link href="/dashboard/services">
              <Button size="sm">Open services manager</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {tab === "categories" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogList
                emptyTitle="No categories"
                emptyDescription="Create sortable categories with colors and icons."
                items={categories.map((c) => ({
                  id: c.id,
                  title: c.name,
                  subtitle: c.description ?? undefined,
                }))}
                onDelete={(id) =>
                  remove("category", deleteServiceCategory, id)
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add category</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={catAction} className="space-y-3">
                <Input name="name" placeholder="Category name" required />
                <Input name="description" placeholder="Description" />
                <Input name="icon" placeholder="Icon key (optional)" />
                <Input name="color" type="color" defaultValue="#64748b" />
                <Input name="sort_order" type="number" defaultValue={0} />
                <AlertMessage error={catState.error} success={catState.success} />
                <FormFooter pending={catPending || deleting} submitLabel="Save category" />
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "rooms" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rooms & resources</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogList
                emptyTitle="No rooms or resources"
                emptyDescription="Add treatment rooms, studios, bays, equipment, and vehicles."
                items={resources.map((r) => ({
                  id: r.id,
                  title: r.name,
                  subtitle: `${r.resource_type}${r.capacity ? ` · cap ${r.capacity}` : ""}`,
                }))}
                onDelete={(id) => remove("resource", deleteBookingResource, id)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add resource</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={resAction} className="space-y-3">
                <Input name="name" placeholder="Name" required />
                <Select name="resource_type" defaultValue="room">
                  <option value="room">Room</option>
                  <option value="equipment">Equipment</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="other">Other</option>
                </Select>
                <Select name="location_id" defaultValue="">
                  <option value="">All locations</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
                <Input name="capacity" type="number" placeholder="Capacity" />
                <AlertMessage error={resState.error} success={resState.success} />
                <FormFooter pending={resPending || deleting} submitLabel="Save resource" />
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "memberships" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Memberships</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogList
                emptyTitle="No memberships"
                emptyDescription="Weekly, monthly, or yearly plans — unlimited or limited visits. Stripe-ready."
                items={memberships.map((m) => ({
                  id: m.id,
                  title: m.name,
                  subtitle: `${m.billing_interval} · ${dollars(m.price_cents)} · ${
                    m.is_unlimited ? "Unlimited" : `${m.visit_limit ?? 0} visits`
                  }`,
                }))}
                onDelete={(id) => remove("membership", deleteMembership, id)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add membership</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={memAction} className="space-y-3">
                <Input name="name" placeholder="Name" required />
                <Textarea name="description" rows={2} placeholder="Description" />
                <Select name="billing_interval" defaultValue="monthly">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
                <Input name="price" placeholder="Price" required />
                <Input name="visit_limit" type="number" placeholder="Visit limit" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_unlimited" /> Unlimited visits
                </label>
                <AlertMessage error={memState.error} success={memState.success} />
                <FormFooter pending={memPending || deleting} submitLabel="Save membership" />
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "packages" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogList
                emptyTitle="No packages"
                emptyDescription="Prepaid visit bundles with expiry and transfer rules."
                items={packages.map((p) => ({
                  id: p.id,
                  title: p.name,
                  subtitle: `${p.total_visits} visits · ${dollars(p.price_cents)}${
                    p.expires_after_days ? ` · expires ${p.expires_after_days}d` : ""
                  }`,
                }))}
                onDelete={(id) => remove("package", deletePackage, id)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add package</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={pkgAction} className="space-y-3">
                <Input name="name" placeholder="Name" required />
                <Textarea name="description" rows={2} />
                <Input name="price" placeholder="Price" required />
                <Input name="total_visits" type="number" defaultValue={5} />
                <Input name="expires_after_days" type="number" placeholder="Expires after days" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="transferable" /> Transferable
                </label>
                <div className="max-h-40 space-y-1 overflow-y-auto text-sm">
                  {services.map((s) => (
                    <label key={s.id} className="flex items-center gap-2">
                      <input type="checkbox" name="service_ids" value={s.id} />
                      {s.name}
                    </label>
                  ))}
                </div>
                <AlertMessage error={pkgState.error} success={pkgState.success} />
                <FormFooter pending={pkgPending || deleting} submitLabel="Save package" />
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "giftcards" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gift cards</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogList
                emptyTitle="No gift cards"
                emptyDescription="Issue digital or fixed-value cards with redeemable balances."
                items={giftCards.map((g) => ({
                  id: g.id,
                  title: g.code,
                  subtitle: `${dollars(g.balance_cents)} remaining · ${g.status}`,
                }))}
              />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue gift card</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={gcAction} className="space-y-3">
                  <Input name="amount" placeholder="Value" required />
                  <Input name="code" placeholder="Custom code (optional)" />
                  <Input name="expires_after_days" type="number" placeholder="Expires after days" />
                  <AlertMessage error={gcState.error} success={gcState.success} />
                  <FormFooter pending={gcPending} submitLabel="Issue card" />
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Redeem</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={redeemAction} className="space-y-3">
                  <Input name="code" placeholder="Gift card code" required />
                  <Input name="amount" placeholder="Amount to redeem" required />
                  <AlertMessage error={redeemState.error} success={redeemState.success} />
                  <FormFooter pending={redeemPending} submitLabel="Redeem" />
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "taxes" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tax rates</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogList
                emptyTitle="No tax rates"
                emptyDescription="Configure inclusive/exclusive rates by country or region."
                items={taxRates.map((t) => ({
                  id: t.id,
                  title: t.name,
                  subtitle: `${(t.rate_bps / 100).toFixed(2)}% · ${
                    t.inclusive ? "Inclusive" : "Exclusive"
                  }${t.region ? ` · ${t.region}` : ""}`,
                }))}
                onDelete={(id) => remove("tax rate", deleteTaxRate, id)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add tax rate</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={taxAction} className="space-y-3">
                <Input name="name" placeholder="Name" required />
                <Input name="rate" placeholder="Rate %" required />
                <Input name="country" placeholder="Country" />
                <Input name="region" placeholder="Province / state" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="inclusive" /> Tax inclusive
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_default" /> Default rate
                </label>
                <AlertMessage error={taxState.error} success={taxState.success} />
                <FormFooter pending={taxPending || deleting} submitLabel="Save tax" />
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "discounts" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Discounts & promo codes</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogList
                emptyTitle="No discounts"
                emptyDescription="Percentage, fixed, coupons, and automatic discounts."
                items={discounts.map((d) => ({
                  id: d.id,
                  title: d.code,
                  subtitle: `${d.name} · ${d.discount_type}`,
                }))}
                onDelete={(id) => remove("discount", deleteDiscountCode, id)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add discount</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={discAction} className="space-y-3">
                <Input name="code" placeholder="PROMO CODE" required />
                <Input name="name" placeholder="Display name" required />
                <Select name="discount_type" defaultValue="percentage">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="automatic">Automatic</option>
                </Select>
                <Input name="percent" placeholder="Percent (for % discounts)" />
                <Input name="amount" placeholder="Amount (for fixed)" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="automatic" /> Apply automatically
                </label>
                <AlertMessage error={discState.error} success={discState.success} />
                <FormFooter pending={discPending || deleting} submitLabel="Save discount" />
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "forms" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Custom forms</CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogList
                emptyTitle="No form templates"
                emptyDescription="Consent, medical, intake, waivers — electronic signature ready."
                items={forms.map((f) => ({
                  id: f.id,
                  title: f.name,
                  subtitle: `${f.form_type}${f.requires_signature ? " · e-sign" : ""}`,
                }))}
                onDelete={(id) => remove("form", deleteFormTemplate, id)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add form template</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-3">
                <Input name="name" placeholder="Form name" required />
                <Select name="form_type" defaultValue="intake">
                  <option value="consent">Consent</option>
                  <option value="medical">Medical</option>
                  <option value="intake">Intake</option>
                  <option value="waiver">Waiver</option>
                  <option value="questionnaire">Questionnaire</option>
                  <option value="other">Other</option>
                </Select>
                <Textarea name="description" rows={2} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="requires_signature" /> Requires e-signature
                </label>
                <AlertMessage error={formState.error} success={formState.success} />
                <FormFooter pending={formPending || deleting} submitLabel="Save form" />
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "hours" ? (
        <HoursSettingsPanel hours={hours} holidays={holidays} closures={closures} />
      ) : null}

      {tab === "booking" ? <BookingSettingsPanel business={business} /> : null}
      {tab === "branding" ? <BrandingSettingsPanel business={business} /> : null}
      {tab === "notifications" ? (
        <NotificationSettingsPanel business={business} />
      ) : null}
      {tab === "ai" ? <AiSettingsPanel business={business} /> : null}
      {tab === "documents" ? (
        <BusinessDocumentsPanel documents={documents} />
      ) : null}

      {tab === "automation" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Automation rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CatalogList
                emptyTitle="No automation rules"
                emptyDescription="Booking, cancellation, reminder, follow-up, auto-assign, auto-confirm, auto-waitlist."
                items={automationRules.map((r) => ({
                  id: r.id,
                  title: r.name,
                  subtitle: `${r.rule_type} · ${r.enabled ? "On" : "Off"}`,
                }))}
                onDelete={(id) => remove("rule", deleteAutomationRule, id)}
              />
              <Link href="/dashboard/automation">
                <Button size="sm" variant="outline">
                  Open waitlist & recurring
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add rule</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={ruleAction} className="space-y-3">
                <Input name="name" placeholder="Rule name" required />
                <Select name="rule_type" defaultValue="reminder">
                  <option value="booking">Booking rules</option>
                  <option value="cancellation">Cancellation rules</option>
                  <option value="reminder">Reminder rules</option>
                  <option value="follow_up">Follow-up rules</option>
                  <option value="auto_assign">Auto assign employees</option>
                  <option value="auto_confirm">Auto confirm</option>
                  <option value="auto_waitlist">Auto waitlist</option>
                </Select>
                <Textarea name="notes" rows={2} placeholder="Config notes" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked /> Enabled
                </label>
                <AlertMessage error={ruleState.error} success={ruleState.success} />
                <FormFooter pending={rulePending || deleting} submitLabel="Save rule" />
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
