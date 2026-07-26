import { Logo } from "@/components/brand/logo";
import {
  APPLY_HREF,
  CONTACT_HREF,
  CTA_MEET_SUMMER_LABEL,
  INDUSTRIES_HREF,
  MEET_SUMMER_HREF,
  PLATFORM_HREF,
  PRIVACY_HREF,
  PRIVATE_ALPHA_HREF,
  PRODUCT_TOUR_HREF,
  PRICING_HREF,
  ROADMAP_HREF,
  SECURITY_HREF,
  STATUS_HREF,
  TERMS_HREF,
} from "@/lib/marketing/alpha";
import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Platform", href: PLATFORM_HREF },
    { label: CTA_MEET_SUMMER_LABEL, href: MEET_SUMMER_HREF },
    { label: "Product Tour", href: PRODUCT_TOUR_HREF },
    { label: "Industries", href: INDUSTRIES_HREF },
  ],
  Company: [
    { label: "Why Private Alpha", href: PRIVATE_ALPHA_HREF },
    { label: "Roadmap", href: ROADMAP_HREF },
    { label: "Pricing", href: PRICING_HREF },
    { label: "Apply", href: APPLY_HREF },
  ],
  Trust: [
    { label: "Security", href: SECURITY_HREF },
    { label: "Privacy", href: PRIVACY_HREF },
    { label: "Terms", href: TERMS_HREF },
    { label: "Status", href: STATUS_HREF },
    { label: "Contact", href: CONTACT_HREF },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-6 py-14 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo href="/" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Chasum is the AI Business Operating System for service
              businesses—connecting the work teams do today with the
              intelligence needed to improve tomorrow.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Private Alpha product status · Design partners only
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

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Chasum. All rights reserved.</p>
          <p className="text-xs">
            Support:{" "}
            <Link href={CONTACT_HREF} className="hover:text-foreground">
              Contact
            </Link>
            {" · "}
            <a
              href="mailto:sales@chasum.app"
              className="hover:text-foreground"
            >
              sales@chasum.app
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
