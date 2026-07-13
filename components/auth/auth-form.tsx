"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import type { AuthState } from "@/lib/actions/auth";
import Link from "next/link";
import { useActionState } from "react";

type AuthFormProps = {
  title: string;
  description: string;
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  hiddenFields?: Record<string, string>;
  alert?: React.ReactNode;
};

export function AuthForm({
  title,
  description,
  action,
  submitLabel,
  children,
  footer,
  hiddenFields,
  alert,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mb-8">
        <Logo />
      </div>

      <Card className="w-full max-w-md border-border/60 shadow-md">
        {alert && <div className="px-6 pt-6">{alert}</div>}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {hiddenFields &&
              Object.entries(hiddenFields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}

            {children}

            {state.error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            {state.success && (
              <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                {state.success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Please wait..." : submitLabel}
            </Button>
          </form>

          {footer && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
    </div>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-primary transition-colors hover:text-primary/80"
    >
      {children}
    </Link>
  );
}
