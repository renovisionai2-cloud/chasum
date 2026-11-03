"use client";

import { Button } from "@/components/ui/button";
import { signOut, type AuthState } from "@/lib/actions/auth";
import { useActionState } from "react";

const initialState: AuthState = {};

export function AccessDeniedSignOut() {
  const [state, action, pending] = useActionState(signOut, initialState);

  return (
    <form action={action} className="mt-8">
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </Button>
      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
