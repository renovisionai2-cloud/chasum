import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OwnerPageFrame } from "@/components/owner/page-frame";
import { getOwnerSecuritySnapshot } from "@/lib/owner/data";
import { Shield } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner · Security",
};

export default async function OwnerSecurityPage() {
  const snapshot = await getOwnerSecuritySnapshot();

  return (
    <OwnerPageFrame
      title="Security"
      description="Platform owner access controls. Normal business accounts cannot reach /owner."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authorization model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{snapshot.rlsNote}</p>
          <p>
            Access is granted when the signed-in email is listed in{" "}
            <code className="text-foreground">PLATFORM_OWNER_EMAILS</code> or
            present in the <code className="text-foreground">platform_admins</code>{" "}
            table (migration 014).
          </p>
          <p>
            Env allowlist entries configured:{" "}
            <span className="font-medium text-foreground">
              {snapshot.envOwnerCount}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Database admins</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.dbAdmins.length === 0 ? (
            <EmptyState
              variant="inline"
              glyph={Shield}
              title="No database admins seeded"
              description="Insert rows into platform_admins or rely on PLATFORM_OWNER_EMAILS."
            />
          ) : (
            <ul className="divide-y divide-border">
              {snapshot.dbAdmins.map((admin) => (
                <li
                  key={`${admin.email}-${admin.created_at}`}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <span className="font-medium">{admin.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {admin.role} ·{" "}
                    {format(new Date(admin.created_at), "MMM d, yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </OwnerPageFrame>
  );
}
