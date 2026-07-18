import { test, expect } from "@playwright/test";

test.describe("public smoke", () => {
  test("marketing home loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/chasum/i);
  });

  test("health endpoint reports JSON", async ({ request }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("ok");
    expect(body).toHaveProperty("checks");
    expect(body.checks).toHaveProperty("softSchemaFallbacks");
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
