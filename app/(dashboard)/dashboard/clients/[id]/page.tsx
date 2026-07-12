import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, TagBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getCustomerProfile } from "@/lib/actions/customers";
import { formatTime, parseISO } from "@/lib/calendar/utils";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, ArrowLeft } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCustomerProfile(id);

  if (!profile) notFound();

  const { customer, appointments } = profile;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader title={customer.name} description="Customer profile" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> {customer.email}
            </p>
            {customer.phone && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> {customer.phone}
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

        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment history</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No appointments yet.
              </p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {appt.service?.name ?? "Service"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(appt.start_time), "MMM d, yyyy")} at{" "}
                        {formatTime(parseISO(appt.start_time))}
                        {appt.staff?.name ? ` · ${appt.staff.name}` : ""}
                        {appt.location?.name ? ` · ${appt.location.name}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
