"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import {
  NAV_LINKS,
  NAV_RESOURCES,
  NAV_SUPPORT_HREF,
} from "@/lib/constants";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_LOGIN_LABEL,
  LOGIN_HREF,
} from "@/lib/marketing/alpha";
import {
  isPrimaryNavActive,
  isResourcesNavActive,
  isSupportNavActive,
} from "@/lib/marketing/nav-active";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function LandingHeader() {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!resourcesOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!resourcesRef.current?.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setResourcesOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [resourcesOpen]);

  const resourceHrefs = NAV_RESOURCES.map((item) => item.href);
  const resourcesActive = isResourcesNavActive(pathname, resourceHrefs);
  const supportActive = isSupportNavActive(pathname, NAV_SUPPORT_HREF);
  const homeActive = isPrimaryNavActive(pathname, "/");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-border/50 bg-background/75 shadow-sm shadow-black/5 backdrop-blur-xl dark:bg-background/65"
          : "border-transparent bg-background/40 backdrop-blur-lg dark:bg-background/45",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-[1480px] items-center justify-between gap-3 px-5 sm:px-6 lg:px-8">
        <Logo
          priority
          href="/"
          className={cn(homeActive && "marketing-logo-home-active")}
          aria-current={homeActive ? "page" : undefined}
        />

        <nav
          className="hidden items-center gap-1.5 xl:flex"
          aria-label="Marketing"
        >
          {NAV_LINKS.map((link) => {
            const active = isPrimaryNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={active}
                className={cn(
                  "marketing-nav-link marketing-focus-ring rounded-full px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors duration-200",
                  active
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="relative" ref={resourcesRef}>
            <button
              type="button"
              onClick={() => setResourcesOpen((open) => !open)}
              className={cn(
                "marketing-focus-ring inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors duration-200",
                resourcesOpen || resourcesActive
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
              )}
              aria-expanded={resourcesOpen}
              aria-haspopup="menu"
            >
              Resources
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  resourcesOpen && "rotate-180",
                )}
              />
            </button>
            {resourcesOpen ? (
              <div
                role="menu"
                className="marketing-nav-panel marketing-nav-dropdown absolute left-1/2 top-[calc(100%+0.75rem)] z-50 w-[22rem] -translate-x-1/2 rounded-2xl p-2"
              >
                {NAV_RESOURCES.map((item) => {
                  const active = isPrimaryNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setResourcesOpen(false)}
                      className={cn(
                        "marketing-focus-ring flex w-full flex-col rounded-xl px-3.5 py-3 text-left transition-colors hover:bg-muted/70",
                        active && "bg-muted/60",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <ThemeToggle />
          <Link href={LOGIN_HREF}>
            <Button variant="ghost" size="sm" className="text-[13px]">
              {CTA_LOGIN_LABEL}
            </Button>
          </Link>
          <Link href={APPLY_HREF}>
            <Button size="sm" className="marketing-cta-button rounded-full px-5">
              {CTA_APPLY_LABEL}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="h-11 w-11 p-0"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/50 transition-[max-height] duration-300 xl:hidden",
          mobileOpen ? "max-h-[42rem]" : "max-h-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4" aria-label="Marketing mobile">
          {NAV_LINKS.map((link) => {
            const active = isPrimaryNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "min-h-11 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
          <p className="mt-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Resources
          </p>
          {NAV_RESOURCES.map((item) => {
            const active = isPrimaryNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "min-h-11 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href={NAV_SUPPORT_HREF}
            className={cn(
              "min-h-11 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              supportActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={() => setMobileOpen(false)}
            aria-current={supportActive ? "page" : undefined}
          >
            Support
          </Link>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
            <Link href={LOGIN_HREF} onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="h-11 w-full">
                {CTA_LOGIN_LABEL}
              </Button>
            </Link>
            <Link href={APPLY_HREF} onClick={() => setMobileOpen(false)}>
              <Button className="h-11 w-full">{CTA_APPLY_LABEL}</Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
