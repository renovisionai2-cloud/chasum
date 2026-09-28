// @vitest-environment node
import { readFileSync } from "node:fs";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { chromium, type Browser } from "playwright-core";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { DashboardTopNav } from "@/components/dashboard/sidebar";
import type { Location } from "@/lib/types/booking";

vi.mock("@/lib/actions/location", () => ({ setLocationScope: vi.fn() }));
vi.mock("@/lib/actions/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/providers/theme-provider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

const widths = [375, 390, 430, 639, 640, 641, 642, 643, 644, 645, 646, 647, 767, 768, 820, 1024, 1366, 1440];
const locations = [
  { id: "north", name: "North Studio", is_active: true, is_default: true },
  { id: "south", name: "Lakeshore Community Wellness Studio — East Annex", is_active: true, is_default: false },
] as Location[];
let browser: Browser;
let css: string;

beforeAll(async () => {
  css = (await postcss([tailwind()]).process(readFileSync("app/globals.css", "utf8"), {
    from: "app/globals.css",
  })).css;
  browser = await chromium.launch();
}, 30_000);
afterAll(async () => { await browser?.close(); });

// Render the actual header and compiled application CSS in a layout-capable browser.
// Transport is mocked; this checks geometry, not hosted authentication/persistence.
it.each([false, true])("contains header controls at every acceptance width (canAdd=%s)", async (canAdd) => {
  const html = renderToStaticMarkup(<DashboardTopNav
    locations={locations}
    locationScope={{ mode: "single", locationId: "north" }}
    locationQuota={{ plan: null, currentCount: 2, canAdd }}
    userEmail="long.operator.account@example.test"
  />);
  const page = await browser.newPage();
  try {
    // No application/asset network requests are needed for geometry.
    await page.route("**/*", (route) => route.abort());
    await page.setContent(`<style>${css}</style><style>:root{--font-geist-sans:Arial,sans-serif}</style>${html}`);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      const metrics = await page.evaluate(() => {
        const header = document.querySelector("header")!;
        const selectors = [...header.querySelectorAll('select, button[aria-haspopup="dialog"]')]
          .filter((el) => el.getBoundingClientRect().width > 0);
        const controls = [...header.querySelectorAll("button, select")]
          .filter((el) => el.getBoundingClientRect().width > 0);
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          height: header.getBoundingClientRect().height,
          selectors: selectors.length,
          // Element hit testing catches overlapping controls as well as viewport overflow.
          obstructed: controls.filter((el) => {
            const r = el.getBoundingClientRect();
            return !el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
          }).map((el) => el.getAttribute("aria-label") || el.textContent),
        };
      });
      expect(metrics.overflow, `${width}px overflow`).toBe(0);
      expect(metrics.height, `${width}px header height`).toBe(64);
      expect(metrics.selectors, `${width}px workspace selectors`).toBe(1);
      if (width >= 640 && width < 768) {
        expect(metrics.obstructed, `${width}px obstructed controls`).toEqual([]);
      }
      if (width >= 640) {
        expect(await page.getByRole("button", { name: canAdd ? "Add location" : "Request plan change" }).isVisible()).toBe(true);
      }
      expect(await page.getByRole("button", { name: "Communications" }).isVisible()).toBe(true);
      expect(await page.getByRole("button", { name: "Switch to dark mode" }).isVisible()).toBe(true);
    }
  } finally {
    await page.close();
  }
}, 30_000);
