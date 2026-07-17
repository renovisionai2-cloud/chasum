import { Logo } from "@/components/brand/logo";
import { NAV_SUPPORT_HREF } from "@/lib/constants";
import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Platform", href: "/#platform" },
    { label: "Product tour", href: "/#showcase" },
    { label: "AI Workforce", href: "/#ai-workforce" },
    { label: "How it works", href: "/#journey" },
  ],
  Solutions: [
    { label: "Industries", href: "/#industries" },
    { label: "Customers", href: "/#stories" },
    { label: "Compare", href: "/#compare" },
    { label: "Pricing", href: "/pricing" },
  ],
  Resources: [
    { label: "FAQ", href: "/#faq" },
    { label: "Support", href: NAV_SUPPORT_HREF },
    { label: "Book demo", href: "mailto:sales@chasum.app?subject=Book%20a%20Chasum%20Demo" },
    { label: "Start free", href: "/signup" },
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
              The AI Business Operating System for service businesses.
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

        <div className="mt-14 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Chasum. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
