"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const SECTION_IDS = NAV_LINKS.map((link) => link.href.replace("/#", ""));

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

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

  const scrollToSection = useCallback((href: string) => {
    const id = href.replace("/#", "");
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    setMobileOpen(false);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-border/50 bg-background/70 shadow-sm shadow-black/5 backdrop-blur-xl dark:bg-background/60"
          : "border-border/40 bg-background/55 backdrop-blur-lg dark:bg-background/50",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo priority />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Marketing">
          {NAV_LINKS.map((link) => {
            const id = link.href.replace("/#", "");
            const active = activeId === id;
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollToSection(link.href)}
                className={cn(
                  "rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
                aria-current={active ? "true" : undefined}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start Free</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
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
          "overflow-hidden border-t border-border/50 transition-[max-height] duration-300 md:hidden",
          mobileOpen ? "max-h-[28rem]" : "max-h-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-6 py-4" aria-label="Marketing mobile">
          {NAV_LINKS.map((link) => {
            const id = link.href.replace("/#", "");
            const active = activeId === id;
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollToSection(link.href)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </button>
            );
          })}
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
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
