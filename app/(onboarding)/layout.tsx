export const dynamic = "force-dynamic";

import { Logo } from "@/components/brand/logo";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 brand-glow" />
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 py-12 sm:px-8">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}
