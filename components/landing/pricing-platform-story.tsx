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

/**
 * Lock-candidate centrepiece — ~12% larger than Final Visual Fix (1200×820).
 * Wider section max-width + larger viewBox / radius for breathing room.
 */
const VIEW_W = 1344;
const VIEW_H = 920;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const RADIUS = 340;
const LINE_LENGTH = RADIUS;

/**
 * Story timing (~1.9s):
 * headline → Your Business alone → lines draw → nodes complete → footnote.
 */
const HEADLINE_MS = 450;
const CENTER_DELAY_MS = 380;
const CENTER_MS = 480;
const LINES_DELAY_MS = 820;
const LINES_MS = 850;
const NODES_DELAY_MS = 1080;
const NODE_STAGGER_MS = 70;
const FOOTNOTE_DELAY_MS = 1650;
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
 * Signature connected-platform constellation for Pricing.
 * "Your Business" is the focal point; capabilities connect outward.
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
      className="mx-auto w-full max-w-7xl"
      role="img"
      aria-label="Your business at the center, connected to bookings, customers, communication, staff, locations, reports, AI, and Summer"
    >
      {/* Mobile: calm wrap around the business core */}
      <div className="sm:hidden">
        <ul className="grid grid-cols-3 gap-x-5 gap-y-8">
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
        <div className="flex justify-center py-11">
          <span
            className={cn(
              "inline-flex flex-col items-center gap-2.5 rounded-full border-2 border-border bg-card px-9 py-7 text-center shadow-sm will-change-[opacity,transform]",
              !reducedMotion && "transition-[opacity,transform]",
              show
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-5 scale-[0.82] opacity-0",
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
            <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
            <span className="text-base font-semibold tracking-tight text-foreground">
              Your Business
            </span>
          </span>
        </div>
        <ul className="grid grid-cols-3 gap-x-5 gap-y-8">
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
        <ul className="mt-8 grid grid-cols-2 justify-items-center gap-x-12">
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
        className="relative mx-auto hidden w-full overflow-visible sm:block"
        style={{
          maxWidth: VIEW_W,
          aspectRatio: `${VIEW_W} / ${VIEW_H}`,
        }}
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
            className="stroke-foreground/20"
            strokeWidth={1.25}
            strokeDasharray="4 14"
            style={
              reducedMotion
                ? { opacity: 1 }
                : {
                    opacity: show ? 1 : 0,
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
                className="stroke-foreground/45"
                strokeWidth={2}
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
            "absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 rounded-full border-2 border-border bg-card px-12 py-8 shadow-sm will-change-[opacity,transform]",
            !reducedMotion && "transition-[opacity,transform]",
            show ? "scale-100 opacity-100" : "scale-[0.8] opacity-0",
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
          <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <span className="whitespace-nowrap text-lg font-semibold tracking-tight text-foreground md:text-xl">
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
                "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 will-change-[opacity,transform]",
                !reducedMotion && "transition-[opacity,transform]",
                show
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-5 scale-[0.86] opacity-0",
              )}
              style={{
                left,
                top,
                ...(reducedMotion
                  ? {}
                  : {
                      transitionDuration: "450ms",
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
                    ? "flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full border border-border/80 bg-card shadow-sm"
                    : "flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-border/70 bg-card shadow-sm"
                }
              >
                <Icon
                  className={
                    isSummer
                      ? "h-6 w-6 text-primary"
                      : "h-6 w-6 text-muted-foreground"
                  }
                  strokeWidth={1.5}
                />
              </span>
              <span
                className={
                  isSummer
                    ? "whitespace-nowrap text-sm font-semibold tracking-tight text-foreground"
                    : "whitespace-nowrap text-sm font-medium tracking-tight text-muted-foreground"
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
          : "translate-y-5 scale-[0.86] opacity-0",
      )}
      style={
        reducedMotion
          ? undefined
          : {
              transitionDuration: "450ms",
              transitionTimingFunction: EASE,
              transitionDelay: show ? `${delayMs}ms` : "0ms",
            }
      }
    >
      <span
        className={
          isSummer
            ? "flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-card"
            : "flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-card"
        }
      >
        <Icon
          className={
            isSummer
              ? "h-6 w-6 text-primary"
              : "h-6 w-6 text-muted-foreground"
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
 * Signature Pricing moment — one-shot viewport story:
 * headline → Your Business → connections draw → nodes → closing line.
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
        threshold: 0.2,
        rootMargin: "0px 0px -8% 0px",
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const show = active || reducedMotion;

  return (
    <div
      ref={sectionRef}
      className="mx-auto max-w-7xl overflow-visible text-center"
    >
      <div
        className={cn(
          "mx-auto max-w-2xl will-change-[opacity,transform]",
          !reducedMotion && "transition-[opacity,transform]",
          show ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        )}
        style={
          reducedMotion
            ? undefined
            : {
                transitionDuration: `${HEADLINE_MS}ms`,
                transitionTimingFunction: EASE,
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

      <div className="mt-24 px-1 md:mt-32 md:px-2 lg:mt-36">
        <PricingPlatformConstellation
          active={active}
          reducedMotion={reducedMotion}
        />
      </div>

      <p
        className={cn(
          "mx-auto mt-24 max-w-lg text-sm leading-relaxed text-muted-foreground will-change-[opacity,transform] md:mt-28 md:text-base",
          !reducedMotion && "transition-[opacity,transform]",
          show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
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
