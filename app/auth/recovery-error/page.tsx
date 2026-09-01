import { AuthLink } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FORGOT_PASSWORD_PATH,
  LOGIN_PATH,
} from "@/lib/auth/recovery";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reset link expired",
};

export default function RecoveryErrorPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 brand-glow" />
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="mb-8">
          <Logo />
        </div>

        <Card className="w-full max-w-md border-border/60 shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset link expired</CardTitle>
            <CardDescription>
              Your password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={FORGOT_PASSWORD_PATH}
              className="inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
            >
              Request a new reset link
            </Link>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <AuthLink href={LOGIN_PATH}>Return to sign in</AuthLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
