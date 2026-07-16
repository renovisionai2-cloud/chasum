import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getPortalSession,
  portalCancelAppointment,
} from "@/lib/actions/booking-engine";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";

type PageProps = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: "Customer Portal",
};

export default async function CustomerPortalPage({ params }: PageProps) {
  const { token } = await params;
  const session = await getPortalSession(token);

  if (!session || session.error || !session.business || !session.customer) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
        <EmptyState
          title="Portal link unavailable"
          description={session?.error ?? "This link is invalid or expired."}
        />
      </div>
    );
  }

  async function cancelAction(formData: FormData) {
    "use server";
    const appointmentId = String(formData.get("appointment_id") ?? "");
    await portalCancelAppointment(token, appointmentId);
    revalidatePath(`/portal/${token}`);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-1">
          <p className="text-sm text-muted-foreground">{session.business.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hello, {session.customer.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage upcoming visits, review history, and cancel when needed.
            Memberships, packages, and gift cards will appear here next.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {(session.upcoming?.length ?? 0) === 0 ? (
              <EmptyState
                variant="panel"
                glyph={Calendar}
                title="No upcoming appointments"
                description="Book your next visit from the public booking page."
              />
            ) : (
              <ul className="divide-y divide-border/80">
                {session.upcoming?.map((appt) => (
                  <li
                    key={appt.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {appt.service?.name ?? "Appointment"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appt.start_time), "MMM d, yyyy · h:mm a")}
                        {appt.staff?.name ? ` · ${appt.staff.name}` : ""}
                      </p>
                      {appt.invoice_number || appt.price_cents != null ? (
                        <p className="text-xs text-muted-foreground">
                          {appt.invoice_number
                            ? `Invoice ${appt.invoice_number}`
                            : null}
                          {appt.price_cents != null
                            ? ` · $${(appt.price_cents / 100).toFixed(2)}`
                            : null}
                          {appt.deposit_cents
                            ? ` · Deposit $${(appt.deposit_cents / 100).toFixed(2)}`
                            : null}
                        </p>
                      ) : null}
                    </div>
                    <form action={cancelAction}>
                      <input type="hidden" name="appointment_id" value={appt.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Cancel
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {(session.past?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No past visits yet.</p>
            ) : (
              <ul className="divide-y divide-border/80">
                {session.past?.slice(0, 20).map((appt) => (
                  <li key={appt.id} className="py-3">
                    <p className="text-sm font-medium">
                      {appt.service?.name ?? "Appointment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appt.start_time), "MMM d, yyyy")} ·{" "}
                      {appt.status.replace(/_/g, " ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memberships · Packages · Gift cards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon — this portal is ready for memberships, packages, and
              gift cards without changing your booking engine.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
