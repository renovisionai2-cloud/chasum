import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
const read = (path: string) => readFileSync(path, "utf8");
it("loads the business catalog at every Booking Sheet ingress, Services, Employees and Command Centre", () => {
  for (const page of ["calendar", "services", "clients/[id]", "employees", "employees/[id]"]) {
    const source = read(`app/(dashboard)/dashboard/${page}/page.tsx`);
    expect(source).toContain("getOperatorServiceCatalog()");
    expect(source).not.toContain("getServices()");
  }
  const commandCentre = read("lib/actions/command-centre.ts");
  expect(commandCentre).toContain("getOperatorServiceCatalog()");
  expect(commandCentre).not.toContain("getServices()");
});
it("does not silently broaden unrelated service readers", () => {
  for (const page of ["business", "automation"]) {
    expect(read(`app/(dashboard)/dashboard/${page}/page.tsx`)).toContain("getServices()");
  }
});
