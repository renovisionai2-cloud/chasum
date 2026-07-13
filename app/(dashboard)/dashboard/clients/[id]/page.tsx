import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, TagBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCustomerProfile } from "@/lib/actions/customers";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, ArrowLeft, Calendar } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCustomerProfile(id);

  if (!profile) notFound();

  const { customer, appointments } = profile;

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
        <PageHeader title={customer.name} description="Client profile" />
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
            {customer.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(customer.tags ?? []).map((tag: string, i: number) => (
                  <TagBadge key={tag} tag={tag} index={i} />
                ))}
              </div>
            )}
            {customer.notes && (
              <p className="pt-2 text-muted-foreground">{customer.notes}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment history</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <EmptyState
                variant="panel"
                glyph={Calendar}
                title="No appointments yet"
                description="Bookings for this client will show up here."
              >
                <Link href="/dashboard/calendar">
                  <Button size="sm">Open calendar</Button>
                </Link>
              </EmptyState>
            ) : (
              <ul className="divide-y divide-border/80">
                {appointments.map((appt) => (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
