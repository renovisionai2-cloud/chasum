import type { Customer } from "@/lib/types/booking";

const KEY = "chasum-recent-customers";
const MAX = 8;
const EMPTY: Customer[] = [];

/** Cached so useSyncExternalStore getSnapshot stays referentially stable. */
let cachedRaw: string | null = null;
let cachedValue: Customer[] = EMPTY;

function parseRecent(raw: string | null): Customer[] {
  if (!raw) return EMPTY;
  if (raw === cachedRaw) return cachedValue;
  try {
    const rows = JSON.parse(raw) as Customer[];
    cachedRaw = raw;
    cachedValue = Array.isArray(rows) ? rows.slice(0, MAX) : EMPTY;
    return cachedValue;
  } catch {
    cachedRaw = raw;
    cachedValue = EMPTY;
    return EMPTY;
  }
}

export function readRecentCustomers(): Customer[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    return parseRecent(localStorage.getItem(KEY));
  } catch {
    return EMPTY;
  }
}

export function pushRecentCustomer(customer: Customer) {
  if (typeof window === "undefined") return;
  try {
    const prev = readRecentCustomers().filter((c) => c.id !== customer.id);
    const next = [customer, ...prev].slice(0, MAX);
    const raw = JSON.stringify(next);
    localStorage.setItem(KEY, raw);
    cachedRaw = raw;
    cachedValue = next;
    window.dispatchEvent(new Event("chasum-recent-customers"));
  } catch {
    /* ignore quota */
  }
}

export function subscribeRecentCustomers(onChange: () => void) {
  window.addEventListener("chasum-recent-customers", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("chasum-recent-customers", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function filterCustomersLocal(
  customers: Customer[],
  query: string,
  limit = 8,
): Customer[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const digits = q.replace(/\D/g, "");
  return customers
    .filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.email.toLowerCase().includes(q)) return true;
      if (c.phone) {
        const phone = c.phone.toLowerCase();
        if (phone.includes(q)) return true;
        if (digits && phone.replace(/\D/g, "").includes(digits)) return true;
      }
      return false;
    })
    .slice(0, limit);
}
