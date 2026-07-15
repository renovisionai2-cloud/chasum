import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerPageFrame } from "@/components/owner/page-frame";
import { requirePlatformOwner } from "@/lib/owner/auth";
import {
  getAppUrl,
  getCronSecret,
  getPlatformOwnerEmails,
  getResendApiKey,
  getServiceRoleKey,
  getSupabaseEnv,
  getTwilioConfig,
  isProductionRuntime,
} from "@/lib/env";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner · Settings",
};

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/70 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function OwnerSettingsPage() {
  const owner = await requirePlatformOwner();

  return (
    <OwnerPageFrame
      title="Settings"
      description="Owner Platform configuration (secrets never displayed)."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingRow label="Signed in as" value={owner.email} />
          <SettingRow label="Auth source" value={owner.source} />
          <SettingRow
            label="Runtime"
            value={isProductionRuntime() ? "production" : "development"}
          />
          <SettingRow label="App URL" value={getAppUrl()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations configured</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingRow
            label="Supabase"
            value={getSupabaseEnv() ? "Yes" : "No"}
          />
          <SettingRow
            label="Service role"
            value={getServiceRoleKey() ? "Yes" : "No"}
          />
          <SettingRow
            label="Resend"
            value={getResendApiKey() ? "Yes" : "No"}
          />
          <SettingRow
            label="Cron secret"
            value={getCronSecret() ? "Yes" : "No"}
          />
          <SettingRow
            label="Twilio"
            value={getTwilioConfig() ? "Yes" : "No"}
          />
          <SettingRow
            label="Owner email allowlist count"
            value={String(getPlatformOwnerEmails().length)}
          />
        </CardContent>
      </Card>
    </OwnerPageFrame>
  );
}
