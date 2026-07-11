import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and booking preferences.
        </p>
      </div>
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Coming in Phase 2</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Account and booking settings will be available in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
