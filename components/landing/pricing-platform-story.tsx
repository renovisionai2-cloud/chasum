"use client";

import {
  PRICING_PLATFORM_BODY,
  PRICING_PLATFORM_EYEBROW,
  PRICING_PLATFORM_FOOTNOTE,
  PRICING_PLATFORM_HEADLINE_LINE_1,
  PRICING_PLATFORM_HEADLINE_LINE_2,
} from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  MapPin,
  MessageSquare,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * Nodes reflect Available Today / Early Access foundations only
 * (Product Truth Matrix). No Coming Next / Future Vision roles.
 */
const OUTER_NODES: ReadonlyArray<{
  label: string;
  icon: LucideIcon;
  /** Degrees from center; 0 = right, -90 = top */
  angle: number;
}> = [
  { label: "Bookings", icon: CalendarDays, angle: -90 },
  { label: "Customers", icon: Users, angle: -45 },
  { label: "Communication", icon: MessageSquare, angle: 0 },
  { label: "Staff", icon: UserRound, angle: 45 },
  { label: "Locations", icon: MapPin, angle: 90 },
  { label: "Reports", icon: BarChart3, angle: 135 },
  { label: "Summer", icon: Sparkles, angle: 180 },
  { label: "AI", icon: Bot, angle: -135 },
];

/** ~50% larger than the first Premium Experience constellation. */
const VIEW_W = 960;
const VIEW_H = 640;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const RADIUS = 232;
const LINE_LENGTH = RADIUS;

/** One-shot sequence (~1.8–2.0s). */
const HEADLINE_MS = 450;
const CENTER_DELAY_MS = 380;
const CENTER_MS = 450;
const LINES_DELAY_MS = 700;
const LINES_MS = 800;
const NODES_DELAY_MS = 900;
const NODE_STAGGER_MS = 80;
const FOOTNOTE_DELAY_MS = 1550;
const FOOTNOTE_MS = 450;

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + Math.cos(rad) * radius,
    y: CY + Math.sin(rad) * radius,
  };
}

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Minimal connected-platform constellation for Pricing.
 * Hairline links + line icons — Apple / Stripe / Linear calm, not a dashboard.
 * "Your Business" is the focal point; capabilities orbit around it.
 */
function PricingPlatformConstellation({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  const show = active || reducedMotion;

  return (
    <div
      className="mx-auto w-full max-w-5xl"
      role="img"
      aria-label="Your business at the center, connected to bookings, customers, communication, staff, locations, reports, AI, and Summer"
    >
      {/* Mobile: calm wrap around the business core */}
      <div className="sm:hidden">
        <ul className="grid grid-cols-3 gap-x-4 gap-y-7">
          {OUTER_NODES.slice(0, 3).map((node, index) => (
            <MobileNode
              key={node.label}
              label={node.label}
              icon={node.icon}
              show={show}
              reducedMotion={reducedMotion}
              delayMs={NODES_DELAY_MS + index * NODE_STAGGER_MS}
            />
          ))}
        </ul>
        <div className="flex justify-center py-8">
          <span
            className={cn(
              "inline-flex flex-col items-center gap-2 rounded-full border border-border/80 bg-card px-7 py-5 text-center shadow-sm will-change-[opacity,transform]",
              !reducedMotion && "transition-[opacity,transform]",
              show
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-3 scale-90 opacity-0",
            )}
            style={
              reducedMotion
                ? undefined
                : {
                    transitionDuration: `${CENTER_MS}ms`,
                    transitionTimingFunction: EASE,
                    transitionDelay: show ? `${CENTER_DELAY_MS}ms` : "0ms",
                  }
            }
          >
            <Building2 className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Your Business
            </span>
          </span>
        </div>
        <ul className="grid grid-cols-3 gap-x-4 gap-y-7">
          {OUTER_NODES.slice(3, 6).map((node, index) => (
            <MobileNode
              key={node.label}
              label={node.label}
              icon={node.icon}
              show={show}
              reducedMotion={reducedMotion}
              delayMs={NODES_DELAY_MS + (index + 3) * NODE_STAGGER_MS}
            />
          ))}
        </ul>
        <ul className="mt-7 grid grid-cols-2 justify-items-center gap-x-10">
          {OUTER_NODES.slice(6).map((node, index) => (
            <MobileNode
              key={node.label}
              label={node.label}
              icon={node.icon}
              show={show}
              reducedMotion={reducedMotion}
              delayMs={NODES_DELAY_MS + (index + 6) * NODE_STAGGER_MS}
            />
          ))}
        </ul>
      </div>

      {/* sm+: constellation */}
      <div
        className="relative mx-auto hidden aspect-[960/640] w-full overflow-visible sm:block"
        style={{ maxWidth: VIEW_W }}
      >
        <svg
          className="absolute inset-0 h-full w-full overflow-visible text-foreground"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray="3 12"
            style={
              reducedMotion
                ? { opacity: 0.35 }
                : {
                    opacity: show ? 0.35 : 0,
                    transition: `opacity ${LINES_MS}ms ${EASE}`,
                    transitionDelay: show ? `${LINES_DELAY_MS}ms` : "0ms",
                  }
            }
          />
          {OUTER_NODES.map((node) => {
            const p = polar(node.angle, RADIUS);
            return (
              <line
                key={`line-${node.label}`}
                x1={CX}
                y1={CY}
                x2={p.x}
                y2={p.y}
                className="stroke-border"
                strokeWidth={1.25}
                strokeLinecap="round"
                pathLength={LINE_LENGTH}
                style={
                  reducedMotion
                    ? {
                        strokeDasharray: LINE_LENGTH,
                        strokeDashoffset: 0,
                      }
                    : {
                        strokeDasharray: LINE_LENGTH,
                        strokeDashoffset: show ? 0 : LINE_LENGTH,
                        transition: `stroke-dashoffset ${LINES_MS}ms ${EASE}`,
                        transitionDelay: show ? `${LINES_DELAY_MS}ms` : "0ms",
                      }
                }
              />
            );
          })}
        </svg>

        <div
          className={cn(
            "absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-border bg-card px-8 py-6 shadow-sm ring-1 ring-border/40 will-change-[opacity,transform]",
            !reducedMotion && "transition-[opacity,transform]",
            show
              ? "scale-100 opacity-100"
              : "scale-[0.88] opacity-0",
          )}
          style={
            reducedMotion
              ? undefined
              : {
                  transitionDuration: `${CENTER_MS}ms`,
                  transitionTimingFunction: EASE,
                  transitionDelay: show ? `${CENTER_DELAY_MS}ms` : "0ms",
                }
          }
        >
          <Building2 className="h-6 w-6 text-primary" strokeWidth={1.5} />
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-foreground md:text-base">
            Your Business
          </span>
        </div>

        {OUTER_NODES.map((node, index) => {
          const p = polar(node.angle, RADIUS);
          const Icon = node.icon;
          const left = `${(p.x / VIEW_W) * 100}%`;
          const top = `${(p.y / VIEW_H) * 100}%`;
          const isSummer = node.label === "Summer";
          return (
            <div
              key={node.label}
              className={cn(
                "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 will-change-[opacity,transform]",
                !reducedMotion && "transition-[opacity,transform]",
                show
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-3 scale-90 opacity-0",
              )}
              style={{
                left,
                top,
                ...(reducedMotion
                  ? {}
                  : {
                      transitionDuration: "420ms",
                      transitionTimingFunction: EASE,
                      transitionDelay: show
                        ? `${NODES_DELAY_MS + index * NODE_STAGGER_MS}ms`
                        : "0ms",
                    }),
              }}
            >
              <span
                className={
                  isSummer
                    ? "flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-card shadow-sm"
                    : "flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-card shadow-sm"
                }
              >
                <Icon
                  className={
                    isSummer
                      ? "h-5 w-5 text-primary"
                      : "h-5 w-5 text-muted-foreground"
                  }
                  strokeWidth={1.5}
                />
              </span>
              <span
                className={
                  isSummer
                    ? "whitespace-nowrap text-xs font-semibold tracking-tight text-foreground"
                    : "whitespace-nowrap text-xs font-medium tracking-tight text-muted-foreground"
                }
              >
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileNode({
  label,
  icon: Icon,
  show,
  reducedMotion,
  delayMs,
}: {
  label: string;
  icon: LucideIcon;
  show: boolean;
  reducedMotion: boolean;
  delayMs: number;
}) {
  const isSummer = label === "Summer";
  return (
    <li
      className={cn(
        "flex flex-col items-center gap-2.5 text-center will-change-[opacity,transform]",
        !reducedMotion && "transition-[opacity,transform]",
        show
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-3 scale-90 opacity-0",
      )}
      style={
        reducedMotion
          ? undefined
          : {
              transitionDuration: "420ms",
              transitionTimingFunction: EASE,
              transitionDelay: show ? `${delayMs}ms` : "0ms",
            }
      }
    >
      <span
        className={
          isSummer
            ? "flex h-14 w-14 items-center justify-center rounded-full border border-border/80 bg-card"
            : "flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-card"
        }
      >
        <Icon
          className={
            isSummer
              ? "h-5 w-5 text-primary"
              : "h-5 w-5 text-muted-foreground"
          }
          strokeWidth={1.5}
        />
      </span>
      <span
        className={
          isSummer
            ? "text-xs font-semibold tracking-tight text-foreground"
            : "text-xs font-medium tracking-tight text-muted-foreground"
        }
      >
        {label}
      </span>
    </li>
  );
}

/**
 * Emotional bridge between plan cards and the comparison table.
 * Storytelling only — not another feature or pricing list.
 * One-shot viewport sequence: headline → centre → lines → nodes → footnote.
 */
export function PricingPlatformStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  useEffect(() => {
    if (reducedMotion) return;
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      {
        // Fire when the section is meaningfully on screen so the sequence is visible.
        threshold: 0.28,
        rootMargin: "0px 0px -12% 0px",
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const show = active || reducedMotion;

  return (
    <div ref={sectionRef} className="mx-auto max-w-5xl overflow-visible text-center">
      <div
        className={cn(
          "mx-auto max-w-2xl will-change-[opacity,transform]",
          !reducedMotion && "transition-[opacity,transform]",
          show
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0",
        )}
        style={
          reducedMotion
            ? undefined
            : {
                transitionDuration: `${HEADLINE_MS}ms`,
                transitionTimingFunction: EASE,
                transitionDelay: show ? "0ms" : "0ms",
              }
        }
      >
        <p className="marketing-eyebrow">{PRICING_PLATFORM_EYEBROW}</p>
        <h2
          id="pricing-platform-heading"
          className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          <span className="block">{PRICING_PLATFORM_HEADLINE_LINE_1}</span>
          <span className="block">{PRICING_PLATFORM_HEADLINE_LINE_2}</span>
        </h2>
        <p className="marketing-lede mx-auto mt-5 max-w-xl">
          {PRICING_PLATFORM_BODY}
        </p>
      </div>

      <div className="mt-16 px-2 md:mt-24 md:px-6 lg:mt-28">
        <PricingPlatformConstellation
          active={active}
          reducedMotion={reducedMotion}
        />
      </div>

      <p
        className={cn(
          "mx-auto mt-16 max-w-lg text-sm leading-relaxed text-muted-foreground will-change-[opacity,transform] md:mt-20 md:text-base",
          !reducedMotion && "transition-[opacity,transform]",
          show
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0",
        )}
        style={
          reducedMotion
            ? undefined
            : {
                transitionDuration: `${FOOTNOTE_MS}ms`,
                transitionTimingFunction: EASE,
                transitionDelay: show ? `${FOOTNOTE_DELAY_MS}ms` : "0ms",
              }
        }
      >
        {PRICING_PLATFORM_FOOTNOTE}
      </p>
    </div>
  );
}
