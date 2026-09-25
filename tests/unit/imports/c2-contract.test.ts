import { describe, expect, it } from "vitest";
import {
  buildAttentionCsv,
  C2_REVIEW_SCHEMA_VERSION,
  neutralizeSpreadsheetCell,
  reviewCategoryForAction,
} from "@/lib/imports/c2-contract";

describe("C2 review contract", () => {
  it("projects governed actions into owner-facing categories", () => {
    expect(reviewCategoryForAction("CREATE")).toBe("Will create");
    expect(reviewCategoryForAction("LINK_EXISTING")).toBe("Will link");
    expect(reviewCategoryForAction("SKIP")).toBe("Already exists / skip");
    expect(reviewCategoryForAction("REVIEW")).toBe("Needs review");
    expect(reviewCategoryForAction("BLOCK")).toBe("Blocked");
  });

  it("keeps the reviewed envelope version explicit", () => {
    expect(C2_REVIEW_SCHEMA_VERSION).toBe("c2-reviewed-v1");
  });
  it.each([
    ["=A1", "'=A1"],
    [" +2", "' +2"],
    ["\t-3", "'\t-3"],
    ["@value", "'@value"],
    ["plain text", "plain text"],
  ])("neutralizes spreadsheet formula prefixes: %s", (input, expected) => {
    expect(neutralizeSpreadsheetCell(input)).toBe(expected);
  });

  it("exports the supplied attention rows with CSV quoting", () => {
    const csv = buildAttentionCsv(
      ["name", "note"],
      [{
        physicalRow: 4,
        issue: "Blocked",
        reasons: ["MISSING_REFERENCE"],
        values: ["=A1", "Smith, Jane"],
      }],
    );

    expect(csv).toContain("Original row,Issue,Reasons,name,note");
    expect(csv).toContain("4,Blocked,MISSING_REFERENCE,'=A1,\"Smith, Jane\"");
    expect(csv.split("\r\n")).toHaveLength(2);
  });
});
