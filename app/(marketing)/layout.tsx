import { Footer } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import { SummerWebsiteConcierge } from "@/components/website-concierge/summer-website-concierge";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingHeader />
      <main className="flex-1 overflow-x-clip">{children}</main>
      <Footer />
      <SummerWebsiteConcierge />
    </>
  );
}
