"use client";

import { Input } from "@/components/ui/input";
import { getCustomers } from "@/lib/actions/customers";
import type { Customer } from "@/lib/types/booking";
import { Search } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

export function CustomerSearch({
  onSelect,
  selectedId,
  autoFocus = false,
  focusSignal = 0,
}: {
  onSelect: (customer: Customer) => void;
  selectedId?: string | null;
  autoFocus?: boolean;
  /** Increment to force-focus the search input from parent shortcuts. */
  focusSignal?: number;
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

  useEffect(() => {
    if (autoFocus || focusSignal > 0) {
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

  const results = !deferred
    ? []
    : fetched.query === deferred
      ? fetched.rows
      : [];
  const showResults = listOpen && !!deferred;

  function select(customer: Customer) {
    onSelect(customer);
    setQuery(customer.name);
    setListOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setListOpen(false);
      return;
    }

    if (!showResults || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
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
    <section className="space-y-2">
      <h3 className="ds-section-title text-sm">Customer search</h3>
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
          onFocus={() => {
            if (deferred) setListOpen(true);
          }}
          placeholder="Name, email, or phone…"
          className="pl-9"
          aria-label="Search customers"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-activedescendant={
            showResults && results[activeIndex]
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          role="combobox"
        />
      </div>
      {showResults ? (
        <ul
          id={listId}
          role="listbox"
          className="max-h-48 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-border"
        >
          {pending && results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              Searching…
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              No matches.
            </li>
          ) : (
            results.map((customer, index) => (
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
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                    selectedId === customer.id || index === activeIndex
                      ? "bg-accent/40"
                      : ""
                  }`}
                >
                  <span className="font-medium">{customer.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {customer.email}
                    {customer.phone ? ` · ${customer.phone}` : ""}
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
