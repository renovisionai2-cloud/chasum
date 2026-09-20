import { expect, test } from "@playwright/test";

const WEEK_CANVAS_MIN_PX = 780;
const PANEL_STANDARD_PX = 480;

type ChromeOptions = {
  viewportWidth: number;
  viewportHeight: number;
  contentMinWidthZero: boolean;
  weekCanvas: boolean;
  receptionPanel: boolean;
  overlayPanel?: boolean;
};

function dashboardChromeHtml({
  viewportWidth,
  viewportHeight,
  contentMinWidthZero,
  weekCanvas,
  receptionPanel,
  overlayPanel = false,
}: ChromeOptions): string {
  const contentMin = contentMinWidthZero ? "min-width:0;" : "";
  const gap = receptionPanel ? 16 : 0;
  const overlayHtml = overlayPanel
    ? `<aside id="overlay" style="position:fixed;top:64px;right:0;bottom:0;width:${PANEL_STANDARD_PX}px;z-index:30;background:#fff;border-left:1px solid #ddd">overlay ${PANEL_STANDARD_PX}</aside>`
    : "";
  const panelHtml = receptionPanel
    ? `<aside id="panel" style="flex-shrink:0;width:${PANEL_STANDARD_PX}px;height:220px;background:#fff;border:1px solid #ddd">reception ${PANEL_STANDARD_PX}</aside>`
    : "";
  const calendarInner = weekCanvas
    ? `<div id="week-scroll" style="max-height:420px;overflow:auto;border:1px solid #ccc">
         <div id="week-canvas" style="min-width:${WEEK_CANVAS_MIN_PX}px;height:180px;background:#e8eef5">week ${WEEK_CANVAS_MIN_PX}</div>
       </div>`
    : `<div id="day-canvas" style="height:180px;background:#eef6ee">day / month cards</div>`;

  return `<!DOCTYPE html>
<html>
  <head>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; }
    </style>
  </head>
  <body>
    <div id="shell" style="display:flex;min-height:${viewportHeight}px;width:${viewportWidth}px">
      <div id="sidebar-slot" style="width:0">
        <aside id="sidebar" style="position:fixed;inset:0 auto 0 0;width:256px;background:#0B1324"></aside>
      </div>
      <div id="content" style="display:flex;flex:1 1 0%;flex-direction:column;padding-left:256px;${contentMin}">
        <header id="header" style="height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;padding:0 16px;border-bottom:1px solid #ddd">
          <div style="min-width:0;flex:1;overflow:hidden">Search clients…</div>
          <div style="flex-shrink:0;white-space:nowrap">Chasum HQ — Main · Account</div>
        </header>
        <main id="main" style="flex:1;padding:28px 32px">
          <div id="row" style="display:flex;align-items:flex-start;gap:${gap}px">
            <div id="calendar" style="flex:1;min-width:0">${calendarInner}</div>
            ${panelHtml}
          </div>
        </main>
      </div>
    </div>
    ${overlayHtml}
  </body>
</html>`;
}

async function measure(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const week = document.getElementById("week-scroll");
    const canvas = document.getElementById("week-canvas");
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      documentOk:
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
      weekScrollWidth: week?.scrollWidth ?? null,
      weekClientWidth: week?.clientWidth ?? null,
      weekInternalScroll: week
        ? week.scrollWidth > week.clientWidth
        : null,
      canvasWidth: canvas
        ? Math.round(canvas.getBoundingClientRect().width)
        : null,
    };
  });
}

test.describe("pre-fix: missing min-width:0 lets Week min-content enlarge the document", () => {
  test("1366 Week + 480 Reception expands the document by the week surplus", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.setContent(
      dashboardChromeHtml({
        viewportWidth: 1366,
        viewportHeight: 768,
        contentMinWidthZero: false,
        weekCanvas: true,
        receptionPanel: true,
      }),
    );
    const m = await measure(page);
    expect(m.scrollWidth).toBe(1598);
    expect(m.clientWidth).toBe(1366);
    expect(m.documentOk).toBe(false);
    expect(m.weekInternalScroll).toBe(false);
    expect(m.canvasWidth).toBe(WEEK_CANVAS_MIN_PX);
  });

  test("1024 Week with Reception closed expands the document", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setContent(
      dashboardChromeHtml({
        viewportWidth: 1024,
        viewportHeight: 768,
        contentMinWidthZero: false,
        weekCanvas: true,
        receptionPanel: false,
      }),
    );
    const m = await measure(page);
    expect(m.scrollWidth).toBeGreaterThan(1024);
    expect(m.documentOk).toBe(false);
    expect(m.weekInternalScroll).toBe(false);
  });
});

test.describe("post-fix: dashboard content min-width:0 contains the document", () => {
  test("1366 Week + Reception keeps the document at 1366 and scrolls Week internally", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.setContent(
      dashboardChromeHtml({
        viewportWidth: 1366,
        viewportHeight: 768,
        contentMinWidthZero: true,
        weekCanvas: true,
        receptionPanel: true,
      }),
    );
    const m = await measure(page);
    expect(m.scrollWidth).toBeLessThanOrEqual(1366);
    expect(m.documentOk).toBe(true);
    expect(m.weekScrollWidth).toBeGreaterThan(m.weekClientWidth ?? 0);
    expect(m.weekInternalScroll).toBe(true);
    expect(m.canvasWidth).toBe(WEEK_CANVAS_MIN_PX);
  });

  test("1024 Week closed stays inside the viewport with local Week scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setContent(
      dashboardChromeHtml({
        viewportWidth: 1024,
        viewportHeight: 768,
        contentMinWidthZero: true,
        weekCanvas: true,
        receptionPanel: false,
      }),
    );
    const m = await measure(page);
    expect(m.scrollWidth).toBeLessThanOrEqual(1024);
    expect(m.documentOk).toBe(true);
    expect(m.weekInternalScroll).toBe(true);
    expect(m.canvasWidth).toBe(WEEK_CANVAS_MIN_PX);
  });

  test("1024 Week + overlay-style 480 panel still contains the document", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setContent(
      dashboardChromeHtml({
        viewportWidth: 1024,
        viewportHeight: 768,
        contentMinWidthZero: true,
        weekCanvas: true,
        receptionPanel: false,
        overlayPanel: true,
      }),
    );
    const m = await measure(page);
    expect(m.documentOk).toBe(true);
    expect(m.weekInternalScroll).toBe(true);
  });

  test("1024 Day / Month cards do not enlarge the document", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setContent(
      dashboardChromeHtml({
        viewportWidth: 1024,
        viewportHeight: 768,
        contentMinWidthZero: true,
        weekCanvas: false,
        receptionPanel: false,
      }),
    );
    expect((await measure(page)).documentOk).toBe(true);
  });

  test("1366 Day + Reception side-by-side stays contained", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.setContent(
      dashboardChromeHtml({
        viewportWidth: 1366,
        viewportHeight: 768,
        contentMinWidthZero: true,
        weekCanvas: false,
        receptionPanel: true,
      }),
    );
    expect((await measure(page)).documentOk).toBe(true);
  });

  test("non-calendar dashboard cards at 1024 stay contained", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setContent(
      dashboardChromeHtml({
        viewportWidth: 1024,
        viewportHeight: 768,
        contentMinWidthZero: true,
        weekCanvas: false,
        receptionPanel: false,
      }).replace(
        "day / month cards",
        `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">
           <div style="padding:16px;border:1px solid #ddd">Customers</div>
           <div style="padding:16px;border:1px solid #ddd">Revenue</div>
         </div>`,
      ),
    );
    expect((await measure(page)).documentOk).toBe(true);
  });
});
