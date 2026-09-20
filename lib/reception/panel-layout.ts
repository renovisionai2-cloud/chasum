/**
 * Reception booking-panel layout contract.
 *
 * Width is derived from the actual dashboard workspace, not whole
 * `window.innerWidth`. Chrome numbers match:
 * - `components/dashboard/shell.tsx` (`min-w-0`, `lg:pl-64`, `lg:px-8`, `md:px-6`, `px-4`)
 * - `components/dashboard/sidebar.tsx` (`w-64`)
 * - `components/calendar/calendar-client.tsx` (`gap-4`, `lg:flex-row`)
 */

export const DASHBOARD_SIDEBAR_PX = 256;
export const DASHBOARD_MAIN_PAD_X_LG_PX = 64;
export const DASHBOARD_MAIN_PAD_X_MD_PX = 48;
export const DASHBOARD_MAIN_PAD_X_SM_PX = 32;
export const RECEPTION_ROW_GAP_PX = 16;
export const RECEPTION_SIDE_BY_SIDE_MIN_PX = 1024;

/** Intentional standard Reception panel width. Not a drag/expand target. */
export const PANEL_STANDARD_PX = 480;
/** Floor for a usable calendar in side-by-side mode. */
export const MIN_CALENDAR_SIDE_BY_SIDE_PX = 480;
/** Keep the panel inside the viewport even when overlayed. */
export const PANEL_VIEWPORT_GUTTER_PX = 24;
/**
 * Deterministic first-paint viewport so SSR HTML matches client hydration.
 * Real browser width is applied after mount via useLayoutEffect.
 */
export const RECEPTION_SSR_VIEWPORT_WIDTH_PX = 1366;

export const OPERATOR_VIEWPORTS = [
  { name: "large-desktop", width: 1440, height: 900 },
  { name: "common-laptop", width: 1366, height: 768 },
  { name: "small-laptop", width: 1024, height: 768 },
  { name: "tablet-landscape", width: 1180, height: 820 },
  { name: "tablet-portrait", width: 820, height: 1180 },
] as const;

export type ReceptionLayoutMode = "stacked" | "side-by-side" | "overlay";

export type ReceptionWorkspaceLayout = {
  mode: ReceptionLayoutMode;
  panelWidthPx: number;
  calendarWidthPx: number;
  usableMainWidthPx: number;
  occupiesFlexSpace: boolean;
};

export function mainHorizontalPaddingPx(viewportWidth: number): number {
  if (viewportWidth >= RECEPTION_SIDE_BY_SIDE_MIN_PX) {
    return DASHBOARD_MAIN_PAD_X_LG_PX;
  }
  if (viewportWidth >= 768) {
    return DASHBOARD_MAIN_PAD_X_MD_PX;
  }
  return DASHBOARD_MAIN_PAD_X_SM_PX;
}

export function usableDashboardMainWidth(viewportWidth: number): number {
  const sidebar =
    viewportWidth >= RECEPTION_SIDE_BY_SIDE_MIN_PX ? DASHBOARD_SIDEBAR_PX : 0;
  return Math.max(0, viewportWidth - sidebar - mainHorizontalPaddingPx(viewportWidth));
}

export function containedPanelWidth(viewportWidth: number): number {
  return Math.max(
    0,
    Math.min(PANEL_STANDARD_PX, viewportWidth - PANEL_VIEWPORT_GUTTER_PX),
  );
}

export function receptionWorkspaceLayout(
  viewportWidth: number,
): ReceptionWorkspaceLayout {
  const usableMainWidthPx = usableDashboardMainWidth(viewportWidth);
  const panelWidthPx = containedPanelWidth(viewportWidth);

  if (viewportWidth < RECEPTION_SIDE_BY_SIDE_MIN_PX) {
    return {
      mode: "stacked",
      panelWidthPx: usableMainWidthPx,
      calendarWidthPx: usableMainWidthPx,
      usableMainWidthPx,
      occupiesFlexSpace: true,
    };
  }

  const neededForSideBySide =
    PANEL_STANDARD_PX + MIN_CALENDAR_SIDE_BY_SIDE_PX + RECEPTION_ROW_GAP_PX;

  if (usableMainWidthPx >= neededForSideBySide) {
    return {
      mode: "side-by-side",
      panelWidthPx: PANEL_STANDARD_PX,
      calendarWidthPx:
        usableMainWidthPx - PANEL_STANDARD_PX - RECEPTION_ROW_GAP_PX,
      usableMainWidthPx,
      occupiesFlexSpace: true,
    };
  }

  return {
    mode: "overlay",
    panelWidthPx,
    calendarWidthPx: usableMainWidthPx,
    usableMainWidthPx,
    occupiesFlexSpace: false,
  };
}

/**
 * In-flow document row width for the dashboard chrome + Reception row.
 * Overlay width is excluded because that surface is viewport-fixed.
 */
export function documentRowWidthPx(
  viewportWidth: number,
  layout: ReceptionWorkspaceLayout,
): number {
  const sidebar =
    viewportWidth >= RECEPTION_SIDE_BY_SIDE_MIN_PX ? DASHBOARD_SIDEBAR_PX : 0;
  const pad = mainHorizontalPaddingPx(viewportWidth);

  if (layout.mode === "overlay") {
    return sidebar + pad + layout.calendarWidthPx;
  }

  if (layout.mode === "stacked") {
    return sidebar + pad + layout.calendarWidthPx;
  }

  return (
    sidebar +
    pad +
    layout.calendarWidthPx +
    RECEPTION_ROW_GAP_PX +
    layout.panelWidthPx
  );
}
