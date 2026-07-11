import { Footer } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
