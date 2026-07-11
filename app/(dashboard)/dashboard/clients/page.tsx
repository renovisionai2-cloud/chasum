import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients",
};

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage your client directory.
        </p>
      </div>
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Coming in Phase 2</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Client management will be available in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
