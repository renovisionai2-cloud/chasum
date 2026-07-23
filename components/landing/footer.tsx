import { Logo } from "@/components/brand/logo";
import {
  APPLY_HREF,
  CONTACT_HREF,
  CTA_APPLY_LABEL,
  CTA_MEET_SUMMER_LABEL,
  MEET_SUMMER_HREF,
  PRIVACY_HREF,
  ROADMAP_HREF,
  SECURITY_HREF,
  STATUS_HREF,
  TERMS_HREF,
  PRIVATE_ALPHA_HREF,
} from "@/lib/marketing/alpha";
import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Platform", href: "/#platform" },
    { label: "Product Tour", href: "/#showcase" },
    { label: CTA_MEET_SUMMER_LABEL, href: MEET_SUMMER_HREF },
    { label: "AI Workforce", href: "/#ai-workforce" },
    { label: "How It Works", href: "/#journey" },
  ],
  Company: [
    { label: "Why Private Alpha?", href: PRIVATE_ALPHA_HREF },
    { label: "Roadmap", href: ROADMAP_HREF },
    { label: "Pricing", href: "/pricing" },
    { label: CTA_APPLY_LABEL, href: APPLY_HREF },
  ],
  Trust: [
    { label: "Privacy Policy", href: PRIVACY_HREF },
    { label: "Terms", href: TERMS_HREF },
    { label: "Security", href: SECURITY_HREF },
    { label: "Status", href: STATUS_HREF },
    { label: "Contact", href: CONTACT_HREF },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-14 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The AI Business Operating System for service businesses — currently
              in Private Alpha with design partners.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground">
                {category}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Chasum. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href={PRIVACY_HREF} className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href={TERMS_HREF} className="hover:text-foreground">
              Terms
            </Link>
            <Link href={SECURITY_HREF} className="hover:text-foreground">
              Security
            </Link>
            <Link href={ROADMAP_HREF} className="hover:text-foreground">
              Roadmap
            </Link>
            <Link href={STATUS_HREF} className="hover:text-foreground">
              Status
            </Link>
            <Link href={CONTACT_HREF} className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
