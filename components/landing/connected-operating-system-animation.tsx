"use client";

import { LogoIcon } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  MessageSquare,
  Users,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

const SYSTEMS: ReadonlyArray<{ label: string; icon: LucideIcon }> = [
  { label: "Scheduling", icon: CalendarDays },
  { label: "Customers", icon: Users },
  { label: "Payments", icon: CreditCard },
  { label: "Employees", icon: UserCog },
  { label: "Communication", icon: MessageSquare },
  { label: "Reporting", icon: BarChart3 },
];

const RADIUS = 42;
const CENTER = 50;
/** Full signature loop — calm, subconscious. */
const LOOP_MS = 16_000;
const PULSE_MS = 2_800;
const GLOW_MS = 900;

type Pulse = {
  id: string;
  path: string;
  startedAt: number;
};

type Beat = {
  /** Source node index, or -1 for core. */
  from: number;
  /** Target node index, or -1 for core. */
  to: number;
  /** Offset within the loop (ms). */
  at: number;
};

/** Staggered inbound/outbound beats — at most two pulses overlap. */
const BEATS: readonly Beat[] = [
  { from: 0, to: -1, at: 0 },
  { from: -1, to: 3, at: 2_400 },
  { from: 1, to: -1, at: 5_200 },
  { from: -1, to: 4, at: 7_600 },
  { from: 5, to: -1, at: 10_200 },
  { from: -1, to: 2, at: 12_600 },
];

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function nodePoint(index: number) {
  const angle = (index / SYSTEMS.length) * Math.PI * 2 - Math.PI / 2;
  return {
    x: CENTER + Math.cos(angle) * RADIUS,
    y: CENTER + Math.sin(angle) * RADIUS,
  };
}

function pathBetween(from: number, to: number) {
  const a = from < 0 ? { x: CENTER, y: CENTER } : nodePoint(from);
  const b = to < 0 ? { x: CENTER, y: CENTER } : nodePoint(to);
  return `M ${a.x.toFixed(3)} ${a.y.toFixed(3)} L ${b.x.toFixed(3)} ${b.y.toFixed(3)}`;
}

/**
 * Signature Connected Operating System experience.
 * Tiny blue data pulses along connection paths — calm, looping, decorative.
 * Layout of nodes/core must stay identical to the static diagram.
 */
export function ConnectedOperatingSystemAnimation({
  active = true,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  const reactId = useId();
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [coreReceiving, setCoreReceiving] = useState(false);
  const [litNode, setLitNode] = useState<number | null>(null);

  const nodes = useMemo(
    () =>
      SYSTEMS.map((system, index) => ({
        ...system,
        ...nodePoint(index),
        index,
      })),
    [],
  );

  const motionEnabled = active && !reducedMotion;

  useEffect(() => {
    if (!motionEnabled) return;

    let loop = 0;
    const timers: number[] = [];
    let cancelled = false;

    const clearTimers = () => {
      for (const id of timers) window.clearTimeout(id);
      timers.length = 0;
    };

    const scheduleLoop = () => {
      if (cancelled) return;
      clearTimers();
      const cycle = loop;
      loop += 1;

      for (const beat of BEATS) {
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            const id = `${reactId}-${cycle}-${beat.at}`;
            const path = pathBetween(beat.from, beat.to);
            const startedAt = performance.now();
            setPulses((prev) => [
              ...prev.filter((p) => startedAt - p.startedAt < PULSE_MS + 200),
              { id, path, startedAt },
            ]);

            timers.push(
              window.setTimeout(() => {
                if (cancelled) return;
                if (beat.to < 0) {
                  setCoreReceiving(true);
                  timers.push(
                    window.setTimeout(() => {
                      if (!cancelled) setCoreReceiving(false);
                    }, GLOW_MS),
                  );
                } else {
                  setLitNode(beat.to);
                  timers.push(
                    window.setTimeout(() => {
                      if (!cancelled) setLitNode(null);
                    }, GLOW_MS),
                  );
                }
                setPulses((prev) => prev.filter((p) => p.id !== id));
              }, PULSE_MS),
            );
          }, beat.at),
        );
      }

      timers.push(window.setTimeout(scheduleLoop, LOOP_MS));
    };

    scheduleLoop();

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [motionEnabled, reactId]);

  const livePulses = motionEnabled ? pulses : [];
  const liveLitNode = motionEnabled ? litNode : null;
  const liveCoreReceiving = motionEnabled && coreReceiving;

  return (
    <div
      className={cn("cos-signature relative aspect-square w-full", className)}
      aria-hidden
      data-active={active ? "true" : "false"}
      data-reduced={reducedMotion ? "true" : "false"}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        fill="none"
      >
        {nodes.map((node) => (
          <line
            key={`line-${node.label}`}
            x1={node.x}
            y1={node.y}
            x2={CENTER}
            y2={CENTER}
            className="fd-connect-line stroke-primary/35"
            strokeWidth="0.35"
            strokeDasharray="1.2 1.2"
            style={{ ["--i" as string]: node.index }}
          />
        ))}

        {livePulses.map((pulse) => (
          <circle
            key={pulse.id}
            r="1.15"
            className="cos-pulse-dot"
            fill="var(--primary)"
          >
            <animateMotion
              dur={`${PULSE_MS}ms`}
              begin="0s"
              fill="freeze"
              path={pulse.path}
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="spline"
              keySplines="0.25 0.1 0.25 1"
            />
          </circle>
        ))}
      </svg>

      {nodes.map((node) => {
        const Icon = node.icon;
        return (
          <div
            key={node.label}
            className={cn(
              "fd-connect-node cos-signature-node absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/90 shadow-sm backdrop-blur-sm sm:h-16 sm:w-16",
              liveLitNode === node.index && "cos-signature-node--lit",
            )}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              ["--i" as string]: node.index,
            }}
          >
            <Icon
              className="h-4 w-4 text-primary sm:h-5 sm:w-5"
              strokeWidth={1.75}
            />
            <span className="mt-0.5 max-w-[3.5rem] truncate text-[9px] font-medium text-muted-foreground sm:text-[10px]">
              {node.label}
            </span>
          </div>
        );
      })}

      <div
        className={cn(
          "fd-connect-core cos-signature-core absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/30 bg-card shadow-[0_0_48px_-6px_hsl(var(--primary)/0.65)] sm:h-28 sm:w-28",
          liveCoreReceiving && "cos-signature-core--receiving",
        )}
      >
        <LogoIcon size={48} className="sm:h-14 sm:w-14" />
      </div>
    </div>
  );
}
