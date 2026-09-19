import { describe, expect, it } from "vitest";
import {
  DASHBOARD_MAIN_PAD_X_LG_PX,
  DASHBOARD_MAIN_PAD_X_MD_PX,
  DASHBOARD_SIDEBAR_PX,
  MIN_CALENDAR_SIDE_BY_SIDE_PX,
  OPERATOR_VIEWPORTS,
  PANEL_STANDARD_PX,
  PANEL_VIEWPORT_GUTTER_PX,
  RECEPTION_ROW_GAP_PX,
  documentRowWidthPx,
  receptionWorkspaceLayout,
} from "@/lib/reception/panel-layout";

/** Pre-fix constants from reception-panel.tsx — kept here as defect evidence. */
const LEGACY_PANEL_WIDE_PX = 640;
const LEGACY_MAX_VIEWPORT_RATIO = 0.72;

function legacyUsableMainWidth(viewportWidth: number): number {
  return viewportWidth - DASHBOARD_SIDEBAR_PX - DASHBOARD_MAIN_PAD_X_LG_PX;
}

function legacyCalendarWidthAfterPanel(
  viewportWidth: number,
  panelWidth: number,
): number {
  return legacyUsableMainWidth(viewportWidth) - RECEPTION_ROW_GAP_PX - panelWidth;
}

describe("pre-fix reception panel width defect", () => {
  it("lets a 640px wide panel starve the calendar inside the dashboard workspace at 1366", () => {
    const calendar = legacyCalendarWidthAfterPanel(1366, LEGACY_PANEL_WIDE_PX);
    expect(calendar).toBe(390);
    expect(calendar).toBeLessThan(MIN_CALENDAR_SIDE_BY_SIDE_PX);
  });

  it("lets window.innerWidth * 0.72 grow far past a usable calendar remainder", () => {
    const viewport = 1366;
    const maxPanel = Math.floor(viewport * LEGACY_MAX_VIEWPORT_RATIO);
    expect(maxPanel).toBe(983);
    const calendar = legacyCalendarWidthAfterPanel(viewport, maxPanel);
    expect(calendar).toBe(47);
    expect(calendar).toBeLessThan(MIN_CALENDAR_SIDE_BY_SIDE_PX);
  });

  it("already crushes the calendar at the 1024 lg side-by-side breakpoint with the default 480px panel", () => {
    const calendar = legacyCalendarWidthAfterPanel(1024, PANEL_STANDARD_PX);
    expect(calendar).toBe(208);
    expect(calendar).toBeLessThan(MIN_CALENDAR_SIDE_BY_SIDE_PX);
  });
});

describe("receptionWorkspaceLayout", () => {
  it("keeps a stable 480px side-by-side panel at 1366 without crushing the calendar", () => {
    const layout = receptionWorkspaceLayout(1366);
    expect(layout.mode).toBe("side-by-side");
    expect(layout.panelWidthPx).toBe(PANEL_STANDARD_PX);
    expect(layout.occupiesFlexSpace).toBe(true);
    expect(layout.calendarWidthPx).toBe(550);
    expect(layout.calendarWidthPx).toBeGreaterThanOrEqual(
      MIN_CALENDAR_SIDE_BY_SIDE_PX,
    );
    expect(documentRowWidthPx(1366, layout)).toBeLessThanOrEqual(1366);
  });

  it("uses the same stable panel width at 1440 — booking steps must not change the shell", () => {
    const layout = receptionWorkspaceLayout(1440);
    expect(layout.mode).toBe("side-by-side");
    expect(layout.panelWidthPx).toBe(PANEL_STANDARD_PX);
    expect(layout.calendarWidthPx).toBe(624);
    expect(documentRowWidthPx(1440, layout)).toBeLessThanOrEqual(1440);
  });

  it("does not stay side-by-side at 1024 where a docked panel would collapse the calendar", () => {
    const layout = receptionWorkspaceLayout(1024);
    expect(layout.mode).toBe("overlay");
    expect(layout.occupiesFlexSpace).toBe(false);
    expect(layout.panelWidthPx).toBe(PANEL_STANDARD_PX);
    expect(layout.calendarWidthPx).toBe(704);
    expect(layout.calendarWidthPx).toBeGreaterThanOrEqual(
      MIN_CALENDAR_SIDE_BY_SIDE_PX,
    );
    expect(layout.panelWidthPx + PANEL_VIEWPORT_GUTTER_PX).toBeLessThanOrEqual(
      1024,
    );
    expect(documentRowWidthPx(1024, layout)).toBeLessThanOrEqual(1024);
  });

  it("uses overlay at 1180 so the calendar keeps the full dashboard main width", () => {
    const layout = receptionWorkspaceLayout(1180);
    expect(layout.mode).toBe("overlay");
    expect(layout.occupiesFlexSpace).toBe(false);
    expect(layout.calendarWidthPx).toBe(
      1180 - DASHBOARD_SIDEBAR_PX - DASHBOARD_MAIN_PAD_X_LG_PX,
    );
    expect(documentRowWidthPx(1180, layout)).toBeLessThanOrEqual(1180);
  });

  it("stacks below the lg breakpoint and stays inside the padded main column at 820", () => {
    const layout = receptionWorkspaceLayout(820);
    expect(layout.mode).toBe("stacked");
    expect(layout.panelWidthPx).toBe(820 - DASHBOARD_MAIN_PAD_X_MD_PX);
    expect(layout.calendarWidthPx).toBe(layout.panelWidthPx);
    expect(documentRowWidthPx(820, layout)).toBeLessThanOrEqual(820);
  });

  it("never lets the panel exceed the viewport minus the containment gutter", () => {
    const layout = receptionWorkspaceLayout(400);
    expect(layout.panelWidthPx).toBeLessThanOrEqual(
      400 - PANEL_VIEWPORT_GUTTER_PX,
    );
  });

  it.each([...OPERATOR_VIEWPORTS])(
    "contains $name ($width x $height) without a document row wider than the viewport",
    ({ width }) => {
      const layout = receptionWorkspaceLayout(width);
      expect(documentRowWidthPx(width, layout)).toBeLessThanOrEqual(width);
      expect(layout.panelWidthPx).toBeLessThanOrEqual(
        width - PANEL_VIEWPORT_GUTTER_PX,
      );
      if (layout.mode === "side-by-side") {
        expect(layout.calendarWidthPx).toBeGreaterThanOrEqual(
          MIN_CALENDAR_SIDE_BY_SIDE_PX,
        );
        expect(layout.panelWidthPx).toBe(PANEL_STANDARD_PX);
      }
    },
  );
});
