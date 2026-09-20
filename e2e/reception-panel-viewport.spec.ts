import { expect, test } from "@playwright/test";
import {
  DASHBOARD_SIDEBAR_PX,
  OPERATOR_VIEWPORTS,
  RECEPTION_ROW_GAP_PX,
  RECEPTION_SIDE_BY_SIDE_MIN_PX,
  documentRowWidthPx,
  mainHorizontalPaddingPx,
  receptionWorkspaceLayout,
} from "../lib/reception/panel-layout";

function chromeHtml(viewportWidth: number, viewportHeight: number): string {
  const layout = receptionWorkspaceLayout(viewportWidth);
  const sidebar =
    viewportWidth >= RECEPTION_SIDE_BY_SIDE_MIN_PX ? DASHBOARD_SIDEBAR_PX : 0;
  const pad = mainHorizontalPaddingPx(viewportWidth);
  const padEach = pad / 2;
  const rowGap = layout.mode === "overlay" ? 0 : RECEPTION_ROW_GAP_PX;
  const rowDirection =
    viewportWidth >= RECEPTION_SIDE_BY_SIDE_MIN_PX ? "row" : "column";
  const panelStyle =
    layout.mode === "overlay"
      ? `position:fixed;top:64px;right:0;bottom:0;width:${layout.panelWidthPx}px;max-width:calc(100vw - 24px);z-index:30;overflow:auto;background:#fff;border-left:1px solid #ddd;`
      : layout.mode === "side-by-side"
        ? `flex-shrink:0;width:${layout.panelWidthPx}px;max-width:calc(100vw - 24px);background:#fff;`
        : `width:100%;max-width:calc(100vw - 24px);background:#fff;`;

  return `<!DOCTYPE html>
<html>
  <head>
    <style>
      html, body { margin: 0; }
      body { overflow-x: auto; }
    </style>
  </head>
  <body>
    <div id="shell" style="display:flex;min-height:${viewportHeight}px;width:${viewportWidth}px">
      ${
        sidebar
          ? `<div id="sidebar" style="width:${sidebar}px;flex-shrink:0;background:#0B1324;"></div>`
          : ""
      }
      <div id="main" style="flex:1;min-width:0;padding:0 ${padEach}px;">
        <div id="row" style="display:flex;flex-direction:${rowDirection};gap:${rowGap}px;align-items:flex-start;">
          <div id="calendar" style="flex:1;min-width:0;height:240px;background:#e8eef5;">calendar</div>
          ${
            layout.mode === "overlay"
              ? `<div id="flex-slot" style="position:fixed;top:64px;right:0;bottom:0;width:${layout.panelWidthPx}px;max-width:calc(100vw - 24px);z-index:30;"><aside id="panel" style="height:100%;overflow:auto;background:#fff;border-left:1px solid #ddd;">
            <button id="close" type="button" style="position:sticky;top:0;background:#fff;">Close</button>
            <input id="search" />
            <select id="service"><option>Cut</option></select>
            <button id="book" type="button">Book</button>
            <div style="height:900px">long booking content</div>
          </aside></div>`
              : `<aside id="panel" style="${panelStyle}">
            <button id="close" type="button" style="position:sticky;top:0;background:#fff;">Close</button>
            <input id="search" />
            <select id="service"><option>Cut</option></select>
            <button id="book" type="button">Book</button>
            <div style="height:900px">long booking content</div>
          </aside>`
          }
        </div>
      </div>
    </div>
  </body>
</html>`;
}

test.describe("Reception dashboard chrome geometry", () => {
  for (const viewport of OPERATOR_VIEWPORTS) {
    test(`${viewport.name} ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      const layout = receptionWorkspaceLayout(viewport.width);
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.setContent(chromeHtml(viewport.width, viewport.height));

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      );
      expect(
        overflow,
        `horizontal overflow at ${viewport.width}x${viewport.height}`,
      ).toBe(true);
      expect(documentRowWidthPx(viewport.width, layout)).toBeLessThanOrEqual(
        viewport.width,
      );

      const panel = page.locator("#panel");
      const calendar = page.locator("#calendar");
      const close = page.locator("#close");
      const search = page.locator("#search");
      const book = page.locator("#book");

      await expect(panel).toBeVisible();
      await expect(close).toBeVisible();
      await expect(search).toBeVisible();
      await expect(book).toBeVisible();

      const panelBox = await panel.boundingBox();
      const calendarBox = await calendar.boundingBox();
      expect(panelBox).toBeTruthy();
      expect(calendarBox).toBeTruthy();
      if (!panelBox || !calendarBox) return;

      expect(panelBox.x).toBeGreaterThanOrEqual(0);
      expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(
        viewport.width + 1,
      );

      if (layout.mode === "side-by-side") {
        expect(calendarBox.width).toBeGreaterThanOrEqual(
          layout.calendarWidthPx - 2,
        );
        expect(calendarBox.width).toBeGreaterThanOrEqual(480);
      }

      if (layout.mode === "overlay") {
        expect(calendarBox.width).toBeGreaterThanOrEqual(
          layout.calendarWidthPx - 2,
        );
      }

      await panel.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await expect(close).toBeVisible();
    });
  }
});
