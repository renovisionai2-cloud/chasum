import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

// Exercise the actual JSX callback with a null draft, without replacing ReceptionPanel.
// Real form lifecycle and non-calendar BookingSheet policy are covered separately.
const source = readFileSync("components/calendar/calendar-client.tsx", "utf8");
const ast = ts.createSourceFile("calendar-client.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback: ts.Expression | undefined;
function visit(node: ts.Node) {
  if (ts.isJsxAttribute(node) && node.name.getText(ast) === "onOpenFullDialog" &&
      node.initializer && ts.isJsxExpression(node.initializer)) callback = node.initializer.expression;
  ts.forEachChild(node, visit);
}
visit(ast);
if (!callback) throw new Error("Reception callback missing");
const compiled = ts.transpileModule(`const callback = ${callback.getText(ast)};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const makeCallback = new Function("openNew", "appointments", "openEdit", `${compiled}; return callback;`);

describe("Reception origin callback", () => {
  it.each([null, undefined, { customerId: "customer", date: "2026-10-20" }])("explicitly opts out of Calendar selection for draft %s", (draft) => {
    const openNew = vi.fn();
    makeCallback(openNew, [], vi.fn())(draft);
    expect(openNew).toHaveBeenCalledExactlyOnceWith(undefined, undefined, draft, false);
  });
  it("keeps existing appointment navigation on the edit path", () => {
    const appointment = { id: "existing" }, openNew = vi.fn(), openEdit = vi.fn();
    makeCallback(openNew, [appointment], openEdit)(null, "existing");
    expect(openEdit).toHaveBeenCalledExactlyOnceWith(appointment);
    expect(openNew).not.toHaveBeenCalled();
  });
});
