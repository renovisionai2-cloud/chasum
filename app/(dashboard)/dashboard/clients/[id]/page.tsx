import { CustomerDocumentsPanel } from "@/components/customers/customer-documents-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, TagBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getCustomerProfile } from "@/lib/actions/customers";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Calendar,
  CalendarX2,
  DollarSign,
  Mail,
  Phone,
  UserCheck,
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

function AppointmentList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: {
    id: string;
    start_time: string;
    status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
    service?: { name?: string } | null;
    staff?: { name?: string } | null;
    location?: { name?: string } | null;
  }[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        variant="panel"
        glyph={Calendar}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="divide-y divide-border/80">
      {items.map((appt) => (
        <li
          key={appt.id}
          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {appt.service?.name ?? "Service"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {format(parseISO(appt.start_time), "MMM d, yyyy")} at{" "}
              {formatTime(parseISO(appt.start_time))}
              {appt.staff?.name ? ` · ${appt.staff.name}` : ""}
              {appt.location?.name ? ` · ${appt.location.name}` : ""}
            </p>
          </div>
          <StatusBadge status={appt.status} />
        </li>
      ))}
    </ul>
  );
}

export default async function CustomerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCustomerProfile(id);

  if (!profile) notFound();

  const { customer, documents, upcoming, history, cancellations, noShows, metrics } =
    profile;

  return (
    <div className="ds-page">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/clients" className="mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            aria-label="Back to clients"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader title={customer.name} description="Client profile">
          <Link href="/dashboard/calendar">
            <Button size="sm">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Book visit
            </Button>
          </Link>
        </PageHeader>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total visits"
          value={String(metrics.totalVisits)}
          description="Completed appointments"
          icon={UserCheck}
          accent="primary"
        />
        <StatCard
          title="Lifetime revenue"
          value={`$${metrics.lifetimeRevenue.toFixed(0)}`}
          description="From completed services"
          icon={DollarSign}
          accent="success"
        />
        <StatCard
          title="No-shows"
          value={String(metrics.noShowCount)}
          description="Marked no-show"
          icon={CalendarX2}
          accent="warning"
        />
        <StatCard
          title="Cancellations"
          value={String(metrics.cancellationCount)}
          description="Cancelled appointments"
          icon={Ban}
          accent="spark"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" aria-hidden="true" /> {customer.email}
            </p>
            {customer.phone && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" aria-hidden="true" /> {customer.phone}
              </p>
            )}
            {customer.referral_source && (
              <p className="text-sm text-muted-foreground">
                Referral: {customer.referral_source}
              </p>
            )}
            {customer.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(customer.tags ?? []).map((tag: string, i: number) => (
                  <TagBadge key={tag} tag={tag} index={i} />
                ))}
              </div>
            )}
            {customer.notes ? (
              <div className="pt-2">
                <p className="ds-label mb-1">Notes</p>
                <p className="text-muted-foreground">{customer.notes}</p>
              </div>
            ) : (
              <p className="pt-2 text-xs text-muted-foreground">No notes yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentList
              items={upcoming}
              emptyTitle="No upcoming appointments"
              emptyDescription="Book the next visit from the calendar."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment history</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentList
              items={history}
              emptyTitle="No past appointments"
              emptyDescription="Completed and past visits appear here."
            />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cancellation history</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentList
                items={cancellations}
                emptyTitle="No cancellations"
                emptyDescription="Cancelled appointments will be listed here."
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>No-shows</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentList
                items={noShows}
                emptyTitle="No no-shows recorded"
                emptyDescription="Appointments marked no-show appear here."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerDocumentsPanel customerId={customer.id} documents={documents} />
        </CardContent>
      </Card>
    </div>
  );
}
