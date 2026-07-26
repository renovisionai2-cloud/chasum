/**
 * Marketing navigation active-state helpers.
 * Only the current route (or a genuine child of that section) may appear active.
 */

export type NavHref = string;

/** Normalize pathname: strip trailing slash except root. */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * Whether a primary nav link should appear active for the current pathname.
 * Hash links (`/#…`) are never pathname-active; homepage scroll handles those.
 */
export function isPrimaryNavActive(
  pathname: string,
  href: NavHref,
): boolean {
  const path = normalizePathname(pathname);

  if (href.startsWith("/#") || href.startsWith("#")) {
    return false;
  }

  const target = normalizePathname(href.split("?")[0] ?? href);

  if (target === "/") {
    return path === "/";
  }

  // Exact match only for leaf marketing pages (prevents Pricing active on Contact).
  if (path === target) {
    return true;
  }

  // Nested section routes (e.g. future /platform/… under Platform).
  return path.startsWith(`${target}/`);
}

/** Support / Contact — active only on the contact route. */
export function isSupportNavActive(pathname: string, supportHref: string): boolean {
  const path = normalizePathname(pathname);
  const target = normalizePathname(supportHref.split("#")[0] ?? supportHref);
  return path === target || path.startsWith(`${target}/`);
}

/** Resources parent — active when the current route belongs to a resource item. */
export function isResourcesNavActive(
  pathname: string,
  resourceHrefs: readonly string[],
): boolean {
  return resourceHrefs.some((href) => {
    if (href.startsWith("/#") || href.startsWith("#")) return false;
    return isPrimaryNavActive(pathname, href);
  });
}
