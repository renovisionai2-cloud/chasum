"use client";

import { Input } from "@/components/ui/input";
import { getCustomers } from "@/lib/actions/customers";
import type { Customer } from "@/lib/types/booking";
import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";

export function CustomerSearch({
  onSelect,
  selectedId,
}: {
  onSelect: (customer: Customer) => void;
  selectedId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim());
  const [fetched, setFetched] = useState<{
    query: string;
    rows: Customer[];
  }>({ query: "", rows: [] });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!deferred) return;

    let cancelled = false;
    startTransition(async () => {
      try {
        const rows = await getCustomers(deferred);
        if (!cancelled) {
          setFetched({ query: deferred, rows: rows.slice(0, 8) });
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

  return (
    <section className="space-y-2">
      <h3 className="ds-section-title text-sm">Customer search</h3>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, email, or phone…"
          className="pl-9"
          aria-label="Search customers"
        />
      </div>
      {deferred && (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-[var(--radius-md)] border border-border">
          {pending && results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">No matches.</li>
          ) : (
            results.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => onSelect(customer)}
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                    selectedId === customer.id ? "bg-accent/40" : ""
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
      )}
    </section>
  );
}
