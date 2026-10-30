import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewBuildBadge } from "@/components/system/preview-build-badge";

const commit = "0123456789abcdef0123456789abcdef01234567";
const preview = { commit, commitShort: commit.slice(0, 7), env: "preview", production: false };
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function mountResponse(data: unknown, ok = true) {
  fetchMock.mockResolvedValue({ ok, json: async () => data });
  const result = render(<PreviewBuildBadge />);
  await act(async () => {});
  return result;
}

describe("verified build footer", () => {
  it.each(["preview", "development"])("shows only returned %s identity and the real details link", async (env) => {
    await mountResponse({ ...preview, env, ref: "private-branch", email: "private@invalid.test", session: "PRIVATE_SESSION" });
    const footer = screen.getByLabelText("Build information");
    expect(footer.tagName).toBe("FOOTER");
    expect(footer).toHaveTextContent(`${env === "preview" ? "Preview" : "Development"} · 0123456 · ${env}`);
    expect(footer).not.toHaveTextContent(/private|PRIVATE|local|0123456789abcdef/);
    const link = screen.getByRole("link", { name: "Build details" });
    expect(link).toHaveAttribute("href", "/api/build-info");
    expect(link).toHaveClass("ds-focus-ring", "min-h-11", "text-foreground");
    expect(footer).toHaveClass("text-muted-foreground", "border-border");
    expect(footer.className).not.toMatch(/fixed|sticky|absolute|z-|amber|pointer-events/);
    expect(fetchMock.mock.calls).toEqual([["/api/build-info"]]);
  });

  const invalid = [
    ["Production", { ...preview, env: "production", production: true }],
    ["Production flag disagreement", { ...preview, production: true }],
    ["Production environment disagreement", { ...preview, env: "production" }],
    ["missing production flag", { ...preview, production: undefined }],
    ["invalid production flag", { ...preview, production: "false" }],
    ["missing environment", { ...preview, env: undefined }],
    ["unknown environment", { ...preview, env: "staging" }],
    ["missing full SHA", { ...preview, commit: undefined }],
    ["invalid full SHA", { ...preview, commit: "z".repeat(40) }],
    ["short SHA as full SHA", { ...preview, commit: "0123456" }],
    ["oversized SHA", { ...preview, commit: commit.repeat(100) }],
    ["missing short SHA", { ...preview, commitShort: undefined }],
    ["mismatched short SHA", { ...preview, commitShort: "abcdef0" }],
    ["full SHA as short SHA", { ...preview, commitShort: commit }],
    ["local development without build identity", { commit: null, commitShort: null, env: "development", production: false }],
    ["empty object", {}], ["null", null], ["array", []], ["string", "preview"],
  ];
  it.each(invalid)("hides %s without fabricating identity", async (_label, data) => {
    const { container } = await mountResponse(data);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides an unsuccessful HTTP response even when its JSON resembles an identity", async () => {
    const { container } = await mountResponse(preview, false);
    expect(container).toBeEmptyDOMElement();
  });
  it.each(["network", "JSON"])("hides a %s failure without fallback labels", async (failure) => {
    if (failure === "network") fetchMock.mockRejectedValue(new Error("offline"));
    else fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError("invalid JSON"); } });
    const { container } = render(<PreviewBuildBadge />);
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("keeps one footer and one read across parent rerenders", async () => {
    const { rerender } = await mountResponse(preview);
    for (let i = 0; i < 4; i++) rerender(<PreviewBuildBadge />);
    expect(screen.getAllByLabelText("Build information")).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("ignores an outstanding response after unmount", async () => {
    let resolve!: (value: unknown) => void;
    fetchMock.mockReturnValue(new Promise((done) => { resolve = done; }));
    const { container, unmount } = render(<PreviewBuildBadge />);
    expect(container).toBeEmptyDOMElement();
    unmount();
    await act(async () => { resolve({ ok: true, json: async () => preview }); });
    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
