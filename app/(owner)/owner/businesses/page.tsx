import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OwnerPageFrame } from "@/components/owner/page-frame";
import { listOwnerBusinesses } from "@/lib/owner/data";
import { Building2 } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Owner · Businesses",
};

export default async function OwnerBusinessesPage() {
  const businesses = await listOwnerBusinesses();

  return (
    <OwnerPageFrame
      title="Businesses"
      description="Every tenant on the Chasum platform."
    >
      {businesses.length === 0 ? (
        <EmptyState
          glyph={Building2}
          title="No businesses yet"
          description="When customers sign up, their businesses will appear here."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Booking</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => (
                  <tr
                    key={biz.id}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{biz.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {biz.email ?? "No email"} · /{biz.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {biz.subscription_plan_key ?? "starter"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{biz.subscription_status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(biz.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/book/${biz.slug}`}
                        className="text-xs font-medium text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open public page
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </OwnerPageFrame>
  );
}
