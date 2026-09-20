import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const shellSource = readFileSync("components/dashboard/shell.tsx", "utf8");
const weekSource = readFileSync("components/calendar/calendar-views.tsx", "utf8");

describe("dashboard root flex containment", () => {
  it("lets the dashboard content column shrink below descendant min-content", () => {
    expect(shellSource).toContain(
      'className="flex min-w-0 flex-1 flex-col lg:pl-64"',
    );
    expect(shellSource).not.toMatch(
      /className="flex flex-1 flex-col lg:pl-64"/,
    );
  });

  it("does not hide overflow on the dashboard shell", () => {
    expect(shellSource).not.toMatch(/overflow-x-hidden/);
    expect(shellSource).not.toMatch(/overflow-hidden/);
  });
});

describe("WeekView internal canvas", () => {
  it("keeps the intentional 780px week canvas inside an overflow-auto scroller", () => {
    expect(weekSource).toContain("overflow-auto");
    expect(weekSource).toContain('className="min-w-[780px]"');
  });
});
