"use client";

import { Input } from "@/components/ui/input";
import {
  searchCommandPalette,
  type CommandSearchCategory,
  type CommandSearchResult,
} from "@/lib/actions/command-search";
import { COMMAND_PALETTE_EVENT } from "@/lib/reception/workflow-events";
import {
  Briefcase,
  Calendar,
  FileText,
  Search,
  UserCog,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

const CATEGORY_LABEL: Record<CommandSearchCategory, string> = {
  pages: "Pages",
  customers: "Customers",
  staff: "Staff",
  services: "Services",
  appointments: "Appointments",
};

const CATEGORY_ICON: Record<CommandSearchCategory, typeof Search> = {
  pages: FileText,
  customers: Users,
  staff: UserCog,
  services: Briefcase,
  appointments: Calendar,
};

function CommandPalettePanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim());
  const [results, setResults] = useState<CommandSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [modHint] = useState(() =>
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform)
      ? "⌘"
      : "Ctrl+",
  );

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const rows = await searchCommandPalette(deferred);
        if (!cancelled) {
          setResults(rows);
          setActiveIndex(0);
        }
      } catch {
        if (!cancelled) setResults([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [deferred]);

  function select(result: CommandSearchResult) {
    onClose();
    router.push(result.href);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex] ?? results[0];
      if (target) select(target);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="relative z-10 w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-xl"
    >
      <div className="relative border-b border-border">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
          placeholder="Search customers, staff, services, appointments, pages…"
          className="h-12 border-0 pl-10 shadow-none focus-visible:ring-0"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            results[activeIndex]
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          role="combobox"
          aria-expanded
        />
      </div>
      <ul
        id={listId}
        role="listbox"
        className="max-h-[min(24rem,50vh)] overflow-y-auto p-1"
      >
        {pending && results.length === 0 ? (
          <li className="px-3 py-3 text-sm text-muted-foreground">
            Searching…
          </li>
        ) : results.length === 0 ? (
          <li className="px-3 py-3 text-sm text-muted-foreground">No matches.</li>
        ) : (
          results.map((result, index) => {
            const Icon = CATEGORY_ICON[result.category];
            const active = index === activeIndex;
            return (
              <li key={result.id} role="presentation">
                <button
                  type="button"
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={active}
                  className={`flex w-full items-start gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm transition-colors ${
                    active ? "bg-accent/50" : "hover:bg-muted/60"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(result)}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {result.title}
                    </span>
                    {result.subtitle ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {CATEGORY_LABEL[result.category]}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <span>↑↓ navigate · Enter open · Esc close</span>
        <span>{modHint}K</span>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(COMMAND_PALETTE_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(COMMAND_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
      />
      <CommandPalettePanel key="palette" onClose={() => setOpen(false)} />
    </div>
  );
}
