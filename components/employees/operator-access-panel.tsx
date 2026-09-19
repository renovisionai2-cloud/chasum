"use client";

import { AlertMessage } from "@/components/ui/form-feedback";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  inviteTrustedOperator,
  resendTrustedOperatorInvite,
  revokeTrustedOperator,
  type TrustedOperatorRow,
} from "@/lib/actions/operator-access";
import type { ActionState } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useActionState } from "react";

function InviteForm() {
  const [state, formAction, pending] = useActionState(
    inviteTrustedOperator,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, undefined, () => refresh());

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trusted_admin_email">Email</Label>
          <Input
            id="trusted_admin_email"
            name="email"
            type="email"
            autoComplete="off"
            required
            placeholder="operator@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trusted_admin_display_name">Display name (optional)</Label>
          <Input
            id="trusted_admin_display_name"
            name="display_name"
            autoComplete="off"
          />
        </div>
      </div>
      <AlertMessage error={state.error} success={state.success} />
      <Button type="submit" disabled={pending}>
        {pending ? "Inviting…" : "Invite Trusted Admin"}
      </Button>
    </form>
  );
}

function OperatorRow({ operator }: { operator: TrustedOperatorRow }) {
  const [resendState, resendAction, resendPending] = useActionState(
    resendTrustedOperatorInvite,
    {} as ActionState,
  );
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeTrustedOperator,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(resendState, undefined, () => refresh());
  useFormAction(revokeState, undefined, () => refresh());

  return (
    <li className="rounded-[var(--radius-md)] border border-border/80 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">{operator.email}</p>
          <p className="text-xs text-muted-foreground">
            {operator.status === "active" ? "Active" : "Pending"}
            {operator.invitedAt
              ? ` · invited ${new Date(operator.invitedAt).toLocaleDateString()}`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={resendAction}>
            <input type="hidden" name="email" value={operator.email} />
            <Button type="submit" variant="outline" size="sm" disabled={resendPending}>
              {resendPending ? "Sending…" : "Resend invitation"}
            </Button>
          </form>
          <form action={revokeAction}>
            <input type="hidden" name="email" value={operator.email} />
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={revokePending}
            >
              {revokePending ? "Revoking…" : "Revoke"}
            </Button>
          </form>
        </div>
      </div>
      <AlertMessage error={resendState.error} success={resendState.success} />
      <AlertMessage error={revokeState.error} success={revokeState.success} />
    </li>
  );
}

export function OperatorAccessPanel({
  canManage,
  operators,
}: {
  canManage: boolean;
  operators: TrustedOperatorRow[];
}) {
  if (!canManage) return null;

  return (
    <Card className="space-y-4 p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Trusted Access</h2>
        <p className="text-sm font-medium">Trusted Admin</p>
        <p className="text-sm text-muted-foreground">
          Full access to this business during Private Alpha.
        </p>
        <p className="text-sm text-muted-foreground">
          Trusted Admins can manage business operations, customers, payments,
          settings, employees, reports and integrations for this tenant. This is
          not employee login, receptionist access, or location-restricted
          permissions. Employee role checkboxes on staff profiles are stored
          only and are not enforced for this access.
        </p>
      </div>
      <InviteForm />
      {operators.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No Trusted Admins yet. Only the primary owner can invite, resend, or
          revoke.
        </p>
      ) : (
        <ul className="space-y-3">
          {operators.map((operator) => (
            <OperatorRow key={operator.email} operator={operator} />
          ))}
        </ul>
      )}
    </Card>
  );
}
