// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
it("pure namespace has no operational, database, provider or nondeterministic dependency", () => {
    for (const file of readdirSync(resolve("lib/imports"))) {
        const source = readFileSync(resolve("lib/imports", file), "utf8");
        expect(source).not.toMatch(/from\s+["'](?:@\/|.*supabase|.*server|.*provider|node:fs|node:https?)/);
        expect(source).not.toMatch(/Date\.now\(|Math\.random\(|randomUUID\(|fetch\(|process\.env/);
    }
});
