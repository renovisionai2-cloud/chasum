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
 * Visual positions around the hub (Product Truth foundations only).
 * Story order is separate — connections play one-by-one in STORY_ORDER.
 */
const NODES: ReadonlyArray<{
  label: string;
  icon: LucideIcon;
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

/** Centre → node storytelling order (not simultaneous). */
const STORY_ORDER = [
  "Bookings",
  "Customers",
  "Staff",
  "Communication",
  "Locations",
  "Summer",
  "Reports",
  "AI",
] as const;

const VIEW_W = 1344;
const VIEW_H = 920;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const RADIUS = 340;
const LINE_LENGTH = RADIUS;

/**
 * Cinematic timeline (~3.2s):
 * headline → pause → Your Business → each line travels then its node activates → settle → footnote.
 */
const HEADLINE_MS = 420;
const PAUSE_AFTER_HEADLINE_MS = 180;
const CENTER_MS = 420;
const HOLD_CENTER_MS = 220;
const LINE_DRAW_MS = 200;
const NODE_AFTER_LINE_MS = 40;
const NODE_APPEAR_MS = 280;
const BETWEEN_CONNECTIONS_MS = 30;
const SETTLE_MS = 220;
const FOOTNOTE_MS = 400;

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type StoryPhase =
  | "idle"
  | "headline"
  | "center"
  | "connecting"
  | "settled"
  | "done";

type StoryState = {
  phase: StoryPhase;
  /** Lines that have finished drawing */
  linesDone: number;
  /** Index currently drawing (-1 = none) */
  drawingIndex: number;
  /** Nodes that have activated */
  nodesDone: number;
  footnote: boolean;
};

const INITIAL_STORY: StoryState = {
  phase: "idle",
  linesDone: 0,
  drawingIndex: -1,
  nodesDone: 0,
  footnote: false,
};

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + Math.cos(rad) * radius,
    y: CY + Math.sin(rad) * radius,
  };
}

function nodeByLabel(label: string) {
  return NODES.find((n) => n.label === label)!;
}

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number, signal: { cancelled: boolean }) {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => {
      if (!signal.cancelled) resolve();
    }, ms);
  });
}

/**
 * Rebuild: sequential centre→capability connections.
 * One controlled timeline — not unrelated fades.
 */
export function PricingPlatformStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [story, setStory] = useState<StoryState>(INITIAL_STORY);
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
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !started) return;
    const signal = { cancelled: false };

    async function run() {
      setStory({
        phase: "headline",
        linesDone: 0,
        drawingIndex: -1,
        nodesDone: 0,
        footnote: false,
      });
      await wait(HEADLINE_MS + PAUSE_AFTER_HEADLINE_MS, signal);
      if (signal.cancelled) return;

      setStory((s) => ({ ...s, phase: "center" }));
      await wait(CENTER_MS + HOLD_CENTER_MS, signal);
      if (signal.cancelled) return;

      setStory((s) => ({ ...s, phase: "connecting" }));

      for (let i = 0; i < STORY_ORDER.length; i++) {
        if (signal.cancelled) return;
        setStory((s) => ({ ...s, drawingIndex: i }));
        await wait(LINE_DRAW_MS, signal);
        if (signal.cancelled) return;

        setStory((s) => ({
          ...s,
          linesDone: i + 1,
          drawingIndex: -1,
        }));
        await wait(NODE_AFTER_LINE_MS, signal);
        if (signal.cancelled) return;

        setStory((s) => ({ ...s, nodesDone: i + 1 }));
        await wait(NODE_APPEAR_MS + BETWEEN_CONNECTIONS_MS, signal);
      }

      if (signal.cancelled) return;
      setStory((s) => ({ ...s, phase: "settled", drawingIndex: -1 }));
      await wait(SETTLE_MS, signal);
      if (signal.cancelled) return;

      setStory((s) => ({ ...s, phase: "done", footnote: true }));
    }

    void run();
    return () => {
      signal.cancelled = true;
    };
  }, [started, reducedMotion]);

  const complete = reducedMotion;
  const showHeadline = complete || story.phase !== "idle";
  const showCenter =
    complete ||
    story.phase === "center" ||
    story.phase === "connecting" ||
    story.phase === "settled" ||
    story.phase === "done";
  const showFootnote = complete || story.footnote;
  const showOrbit =
    complete ||
    story.phase === "connecting" ||
    story.phase === "settled" ||
    story.phase === "done";

  return (
    <div
      ref={sectionRef}
      className="mx-auto max-w-7xl overflow-visible text-center"
    >
      <style>{`
        @keyframes chasum-draw-line {
          from { stroke-dashoffset: ${LINE_LENGTH}; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes chasum-node-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.84); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      <div
        className={cn(
          "mx-auto max-w-2xl will-change-[opacity,transform]",
          !reducedMotion && "transition-[opacity,transform]",
          showHeadline
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0",
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
        <div
          className="relative mx-auto w-full max-w-7xl overflow-visible"
          style={{
            maxWidth: VIEW_W,
            aspectRatio: `${VIEW_W} / ${VIEW_H}`,
          }}
          role="img"
          aria-label="Your business at the center, connected to bookings, customers, staff, communication, locations, Summer, reports, and AI"
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
              style={{
                opacity: showOrbit ? 1 : 0,
                transition: reducedMotion
                  ? undefined
                  : `opacity ${SETTLE_MS}ms ${EASE}`,
              }}
            />

            {STORY_ORDER.map((label, storyIndex) => {
              const node = nodeByLabel(label);
              const p = polar(node.angle, RADIUS);
              const isDone = complete || story.linesDone > storyIndex;
              const isDrawing =
                !complete && story.drawingIndex === storyIndex;

              return (
                <line
                  key={`line-${label}`}
                  x1={CX}
                  y1={CY}
                  x2={p.x}
                  y2={p.y}
                  className="stroke-foreground/55"
                  strokeWidth={2.25}
                  strokeLinecap="round"
                  pathLength={LINE_LENGTH}
                  style={
                    complete || isDone
                      ? {
                          strokeDasharray: LINE_LENGTH,
                          strokeDashoffset: 0,
                        }
                      : isDrawing
                        ? {
                            strokeDasharray: LINE_LENGTH,
                            strokeDashoffset: LINE_LENGTH,
                            animation: `chasum-draw-line ${LINE_DRAW_MS}ms ${EASE} forwards`,
                          }
                        : {
                            strokeDasharray: LINE_LENGTH,
                            strokeDashoffset: LINE_LENGTH,
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
              showCenter
                ? "scale-100 opacity-100"
                : "scale-[0.8] opacity-0",
            )}
            style={
              reducedMotion
                ? undefined
                : {
                    transitionDuration: `${CENTER_MS}ms`,
                    transitionTimingFunction: EASE,
                  }
            }
          >
            <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
            <span className="whitespace-nowrap text-lg font-semibold tracking-tight text-foreground md:text-xl">
              Your Business
            </span>
          </div>

          {STORY_ORDER.map((label, storyIndex) => {
            const node = nodeByLabel(label);
            const Icon = node.icon;
            const p = polar(node.angle, RADIUS);
            const left = `${(p.x / VIEW_W) * 100}%`;
            const top = `${(p.y / VIEW_H) * 100}%`;
            const isSummer = label === "Summer";
            const visible = complete || story.nodesDone > storyIndex;

            return (
              <div
                key={label}
                className="absolute z-10 flex flex-col items-center gap-2"
                style={{
                  left,
                  top,
                  transform: "translate(-50%, -50%)",
                  opacity: visible ? 1 : 0,
                  ...(complete || reducedMotion
                    ? {}
                    : visible
                      ? {
                          animation: `chasum-node-in ${NODE_APPEAR_MS}ms ${EASE} both`,
                        }
                      : {
                          transform: "translate(-50%, -50%) scale(0.84)",
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
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p
        className={cn(
          "mx-auto mt-24 max-w-lg text-sm leading-relaxed text-muted-foreground will-change-[opacity,transform] md:mt-28 md:text-base",
          !reducedMotion && "transition-[opacity,transform]",
          showFootnote
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0",
        )}
        style={
          reducedMotion
            ? undefined
            : {
                transitionDuration: `${FOOTNOTE_MS}ms`,
                transitionTimingFunction: EASE,
              }
        }
      >
        {PRICING_PLATFORM_FOOTNOTE}
      </p>
    </div>
  );
}
