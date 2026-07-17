"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import {
  NAV_LINKS,
  NAV_RESOURCES,
  NAV_SUPPORT_HREF,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const SECTION_IDS = [
  ...NAV_LINKS.map((link) => link.href.replace("/#", "")),
  ...NAV_RESOURCES.map((link) => link.href.replace("/#", "")),
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id;
        if (top) setActiveId(top);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.08, 0.25, 0.5],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
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

  const scrollToSection = useCallback((href: string) => {
    const id = href.replace("/#", "");
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    setMobileOpen(false);
    setResourcesOpen(false);
  }, []);

  const resourceActive = NAV_RESOURCES.some(
    (item) => item.href.replace("/#", "") === activeId,
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-border/50 bg-background/75 shadow-sm shadow-black/5 backdrop-blur-xl dark:bg-background/65"
          : "border-transparent bg-background/40 backdrop-blur-lg dark:bg-background/45",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <Logo priority />

        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="Marketing"
        >
          {NAV_LINKS.map((link) => {
            const id = link.href.replace("/#", "");
            const active = activeId === id;
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollToSection(link.href)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors duration-200",
                  active
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                )}
                aria-current={active ? "true" : undefined}
              >
                {link.label}
              </button>
            );
          })}

          <div className="relative" ref={resourcesRef}>
            <button
              type="button"
              onClick={() => setResourcesOpen((open) => !open)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors duration-200",
                resourcesOpen || resourceActive
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
              )}
              aria-expanded={resourcesOpen}
              aria-haspopup="menu"
            >
              Resources
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  resourcesOpen && "rotate-180",
                )}
              />
            </button>
            {resourcesOpen ? (
              <div
                role="menu"
                className="marketing-nav-panel absolute left-1/2 top-[calc(100%+0.75rem)] z-50 w-[22rem] -translate-x-1/2 rounded-2xl p-2"
              >
                {NAV_RESOURCES.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    role="menuitem"
                    onClick={() => scrollToSection(item.href)}
                    className="flex w-full flex-col rounded-xl px-3.5 py-3 text-left transition-colors hover:bg-muted/70"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {item.label}
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <a
            href={NAV_SUPPORT_HREF}
            className="rounded-full px-3.5 py-2 text-[13px] font-medium tracking-tight text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.04] hover:text-foreground"
          >
            Support
          </a>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-[13px]">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="marketing-cta-button rounded-full px-5">
              Start Free
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
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
          "overflow-hidden border-t border-border/50 transition-[max-height] duration-300 lg:hidden",
          mobileOpen ? "max-h-[40rem]" : "max-h-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4" aria-label="Marketing mobile">
          {NAV_LINKS.map((link) => {
            const id = link.href.replace("/#", "");
            const active = activeId === id;
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollToSection(link.href)}
                className={cn(
                  "rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </button>
            );
          })}
          <p className="mt-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Resources
          </p>
          {NAV_RESOURCES.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => scrollToSection(item.href)}
              className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </button>
          ))}
          <a
            href={NAV_SUPPORT_HREF}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Support
          </a>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">
                Log in
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Start Free</Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
