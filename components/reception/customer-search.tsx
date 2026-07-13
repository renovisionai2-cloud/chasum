"use client";

import { Input } from "@/components/ui/input";
import { getCustomers } from "@/lib/actions/customers";
import {
  filterCustomersLocal,
  pushRecentCustomer,
  readRecentCustomers,
  subscribeRecentCustomers,
} from "@/lib/reception/recent-customers";
import type { Customer } from "@/lib/types/booking";
import { Loader2, Search, X } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

function useRecentCustomers() {
  return useSyncExternalStore(
    subscribeRecentCustomers,
    readRecentCustomers,
    () => [] as Customer[],
  );
}

export function CustomerSearch({
  onSelect,
  selectedId,
  autoFocus = false,
  focusSignal = 0,
  seedCustomers = [],
}: {
  onSelect: (customer: Customer) => void;
  selectedId?: string | null;
  autoFocus?: boolean;
  focusSignal?: number;
  /** In-memory customers for instant local matching before the server responds. */
  seedCustomers?: Customer[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const deferred = useDeferredValue(query.trim());
  const [fetched, setFetched] = useState<{
    query: string;
    rows: Customer[];
  }>({ query: "", rows: [] });
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const recent = useRecentCustomers();

  useEffect(() => {
    if (autoFocus || focusSignal > 0) {
      // onFocus opens the list — avoid setState here (cascading render lint).
      inputRef.current?.focus();
    }
  }, [autoFocus, focusSignal]);

  useEffect(() => {
    if (!deferred) return;

    let cancelled = false;
    startTransition(async () => {
      try {
        const rows = await getCustomers(deferred);
        if (!cancelled) {
          setFetched({ query: deferred, rows: rows.slice(0, 8) });
          setActiveIndex(0);
        }
      } catch {
        if (!cancelled) setFetched({ query: deferred, rows: [] });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deferred]);

  const localHits = deferred
    ? filterCustomersLocal(seedCustomers, deferred, 8)
    : [];

  const serverHits =
    deferred && fetched.query === deferred ? fetched.rows : [];

  const results = (() => {
    if (!deferred) return [];
    const map = new Map<string, Customer>();
    for (const c of localHits) map.set(c.id, c);
    for (const c of serverHits) map.set(c.id, c);
    return [...map.values()].slice(0, 8);
  })();

  const showRecent = listOpen && !deferred && recent.length > 0;
  const showResults = listOpen && !!deferred;
  const listItems = showRecent ? recent : results;

  function select(customer: Customer) {
    pushRecentCustomer(customer);
    onSelect(customer);
    setQuery(customer.name);
    setListOpen(false);
  }

  function clear() {
    setQuery("");
    setListOpen(true);
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (query) clear();
      else setListOpen(false);
      return;
    }

    if (!listOpen || listItems.length === 0) {
      if (e.key === "ArrowDown" && (showRecent || showResults)) {
        e.preventDefault();
        setListOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, listItems.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const target = listItems[activeIndex] ?? listItems[0];
      if (target) select(target);
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="ds-section-title text-sm">Find customer</h3>
        <span className="text-[10px] text-muted-foreground">↑↓ · Enter · Esc</span>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setListOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            window.setTimeout(() => setListOpen(false), 150);
          }}
          onFocus={() => setListOpen(true)}
          placeholder="Name, phone, or email…"
          className="pl-9 pr-9"
          aria-label="Search customers"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-activedescendant={
            listOpen && listItems[activeIndex]
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          role="combobox"
        />
        {pending && deferred ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {showRecent || showResults ? (
        <ul
          id={listId}
          role="listbox"
          className="max-h-52 space-y-0.5 overflow-y-auto rounded-[var(--radius-md)] border border-border bg-card shadow-xs"
        >
          {showRecent ? (
            <li className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Recent
            </li>
          ) : null}
          {showResults && pending && results.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </li>
          ) : showResults && results.length === 0 ? (
            <li className="px-3 py-2.5 text-xs text-muted-foreground">
              No matches. Try phone or email, or add a new customer below.
            </li>
          ) : (
            listItems.map((customer, index) => (
              <li key={customer.id} role="presentation">
                <button
                  type="button"
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={
                    selectedId === customer.id || index === activeIndex
                  }
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(customer)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none ${
                    selectedId === customer.id || index === activeIndex
                      ? "bg-accent/45"
                      : ""
                  }`}
                >
                  <span className="font-medium leading-tight">
                    {customer.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {customer.phone ? `${customer.phone} · ` : ""}
                    {customer.email}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </section>
  );
}
