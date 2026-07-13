"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createApiKey,
  createWebhook,
  revokeApiKey,
  deleteWebhook,
  toggleWebhook,
} from "@/lib/actions/developer";
import { WEBHOOK_EVENTS } from "@/lib/types/integrations";
import type { ActionState } from "@/lib/types/booking";
import { confirmDelete, useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useToast } from "@/providers/toast-provider";
import { Copy, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

type ApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
};

type WebhookRow = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
};

function ApiKeyForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createApiKey, {} as ActionState & { rawKey?: string });
  useFormAction(state, undefined, state.rawKey ? undefined : onClose);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="key_name">Key name</Label>
        <Input id="key_name" name="name" placeholder="Production API" required />
      </div>
      <div className="space-y-2">
        <Label>Scopes</Label>
        <div className="flex gap-4">
          {["read", "write", "webhooks"].map((scope) => (
            <label key={scope} className="flex items-center gap-2 text-sm">
              <Checkbox name="scopes" value={scope} defaultChecked />
              {scope}
            </label>
          ))}
        </div>
      </div>
      {state.rawKey && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-3">
          <p className="text-xs font-medium text-success">Copy your API key now:</p>
          <code className="mt-1 block break-all text-xs">{state.rawKey}</code>
        </div>
      )}
      <AlertMessage error={state.error} success={state.success} />
      <FormFooter onCancel={onClose} pending={pending} submitLabel="Create key" />
    </form>
  );
}

export function DeveloperManager({
  apiKeys,
  webhooks,
}: {
  apiKeys: ApiKeyRow[];
  webhooks: WebhookRow[];
}) {
  const [keyOpen, setKeyOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [webhookState, webhookAction, webhookPending] = useActionState(
    createWebhook,
    {} as ActionState & { secret?: string },
  );
  const refresh = useRefresh();
  const { toast } = useToast();

  useFormAction(webhookState, () => refresh(), webhookState.secret ? undefined : () => setWebhookOpen(false));

  async function handleRevokeKey(id: string) {
    if (!(await confirmDelete("Revoke this API key?"))) return;
    const result = await revokeApiKey(id);
    toast(result.error ? result.error : (result.success ?? "Revoked."), result.error ? "error" : "success");
    refresh();
  }

  async function handleDeleteWebhook(id: string) {
    if (!(await confirmDelete("Delete this webhook?"))) return;
    const result = await deleteWebhook(id);
    toast(result.error ? result.error : (result.success ?? "Deleted."), result.error ? "error" : "success");
    refresh();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">API Keys</h2>
          <Button size="sm" onClick={() => setKeyOpen(true)}>Create key</Button>
        </div>
        {apiKeys.length === 0 ? (
          <EmptyState
            variant="panel"
            title="No API keys"
            description="Create an API key to access the REST API."
          >
            <Button size="sm" onClick={() => setKeyOpen(true)}>
              Create key
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <Card key={key.id} className="ds-card-interactive">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {key.key_prefix}… · {key.scopes.join(", ")}
                      {key.last_used_at && ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <IconButton label={`Revoke ${key.name}`} className="text-destructive" onClick={() => handleRevokeKey(key.id)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <Button size="sm" variant="outline" onClick={() => setWebhookOpen(true)}>Add webhook</Button>
        </div>
        {webhooks.length === 0 ? (
          <EmptyState
            variant="panel"
            title="No webhooks"
            description="Receive real-time events for Zapier, Make.com, or custom integrations."
          >
            <Button size="sm" variant="outline" onClick={() => setWebhookOpen(true)}>
              Add webhook
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {webhooks.map((wh) => (
              <Card key={wh.id} className="ds-card-interactive">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{wh.url}</p>
                    <p className="text-sm text-muted-foreground">
                      {wh.events.length} events · {wh.active ? "Active" : "Paused"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={async () => {
                      await toggleWebhook(wh.id, !wh.active);
                      refresh();
                    }}>
                      {wh.active ? "Pause" : "Enable"}
                    </Button>
                    <IconButton label="Delete webhook" className="text-destructive" onClick={() => handleDeleteWebhook(wh.id)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card className="border-border/60">
        <CardContent className="space-y-2 p-5 text-sm">
          <p className="font-medium">REST API</p>
          <p className="text-muted-foreground">
            Base URL: <code>/api/v1/</code> · Auth: <code>Authorization: Bearer chsm_...</code>
          </p>
          <p className="text-muted-foreground">
            Zapier/Make discovery: <code>/api/integrations/zapier</code>
          </p>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/integrations/zapier`)}>
            <Copy className="h-4 w-4" /> Copy integration URL
          </Button>
        </CardContent>
      </Card>

      <Dialog open={keyOpen} onClose={() => setKeyOpen(false)} title="Create API key">
        <ApiKeyForm onClose={() => setKeyOpen(false)} />
      </Dialog>

      <Dialog open={webhookOpen} onClose={() => setWebhookOpen(false)} title="Add webhook endpoint">
        <form action={webhookAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Endpoint URL</Label>
            <Input id="webhook_url" name="url" type="url" placeholder="https://hooks.zapier.com/..." required />
          </div>
          <div className="space-y-2">
            <Label>Events</Label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-3">
              {WEBHOOK_EVENTS.map((event) => (
                <label key={event} className="flex items-center gap-2 text-sm">
                  <Checkbox name="events" value={event} defaultChecked />
                  {event}
                </label>
              ))}
            </div>
          </div>
          {webhookState.secret && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium">Webhook secret (save this):</p>
              <code className="mt-1 block break-all">{webhookState.secret}</code>
            </div>
          )}
          <AlertMessage error={webhookState.error} success={webhookState.success} />
          <FormFooter onCancel={() => setWebhookOpen(false)} pending={webhookPending} submitLabel="Create webhook" />
        </form>
      </Dialog>
    </div>
  );
}
