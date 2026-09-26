// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { readSaasBillingConfiguration } from "@/lib/billing/saas-configuration";
import { evaluateSaasBillingReadiness } from "@/lib/billing/saas-readiness";

vi.mock("server-only", () => ({}));

const valid = {
  VERCEL_ENV: "preview",
  CHASUM_SAAS_BILLING_MODE: "test",
  CHASUM_SAAS_STRIPE_SECRET_KEY: "sk_test_SyntheticSentinel".padEnd(180, "X"),
  CHASUM_SAAS_STRIPE_WEBHOOK_SECRET: "whsec_SyntheticSentinel".padEnd(180, "Y"),
  CHASUM_SAAS_NEW_PURCHASES_ENABLED: "true",
};

describe("dedicated SaaS configuration syntax (no provider validation)", () => {
  it.each([
    ["sk_test_", "preview"], ["rk_test_", "preview"],
    ["sk_test_", "development"], ["rk_test_", "development"],
    ["sk_live_", "production"], ["rk_live_", "production"],
  ])("accepts %s with matching mode in %s", (prefix, runtime) => {
    const mode = prefix.includes("live") ? "live" : "test";
    expect(readSaasBillingConfiguration({ ...valid, VERCEL_ENV: runtime,
      CHASUM_SAAS_BILLING_MODE: mode, CHASUM_SAAS_STRIPE_SECRET_KEY: `${prefix}Synthetic`,
    }).configurationStatus).toBe("configured");
  });

  it.each([
    ["CHASUM_SAAS_BILLING_MODE", undefined, "disabled"],
    ["CHASUM_SAAS_BILLING_MODE", "disabled", "disabled"],
    ...["", " ", "TEST", "unknown", " test"].map((value) => ["CHASUM_SAAS_BILLING_MODE", value, "invalid_mode"]),
    ...[undefined, "", " ", "sk_test_", "rk_live_", "pk_test_Synthetic", "sk_test_bad key", "sk_test_bad\n", " sk_test_Synthetic"].map((value) => ["CHASUM_SAAS_STRIPE_SECRET_KEY", value, "invalid_secret_key"]),
    ...["sk_live_Synthetic", "rk_live_Synthetic"].map((value) => ["CHASUM_SAAS_STRIPE_SECRET_KEY", value, "key_mode_mismatch"]),
    ...[undefined, "", " ", "whsec_", "bad", "whsec_bad key", "whsec_bad\n"].map((value) => ["CHASUM_SAAS_STRIPE_WEBHOOK_SECRET", value, "invalid_webhook_secret"]),
    ...[undefined, "", "staging", "PRODUCTION", "unknown"].map((value) => ["VERCEL_ENV", value, "unknown_runtime"]),
  ])("fails closed for %s=%s", (name, value, status) => {
    const config = readSaasBillingConfiguration({ ...valid, [name!]: value });
    expect(config.configurationStatus).toBe(status);
    const evaluated = evaluateSaasBillingReadiness(config, {
      provider: "stripe", checkoutImplemented: true, reconciliationImplemented: true,
    });
    expect(evaluated.checkout.available).toBe(false);
    expect(evaluated.reconciliation.available).toBe(false);
  });

  it.each(["preview", "development", undefined, "unknown"])("rejects live in %s even with optimized NODE_ENV", (runtime) => {
    const config = readSaasBillingConfiguration({ ...valid, VERCEL_ENV: runtime, NODE_ENV: "production",
      CHASUM_SAAS_BILLING_MODE: "live", CHASUM_SAAS_STRIPE_SECRET_KEY: "sk_live_Synthetic",
    });
    expect(config.runtime).toBe(runtime === "preview" || runtime === "development" ? runtime : "unknown");
    expect(config.configurationStatus).toBe(config.runtime === "unknown" ? "unknown_runtime" : "live_requires_production");
  });

  it.each(["preview", "development"])("allows test syntax only with recognized non-Production %s identity", (runtime) => {
    expect(readSaasBillingConfiguration({ ...valid, VERCEL_ENV: runtime }).configurationStatus).toBe("configured");
  });

  it.each(["sk_test_", "rk_test_"])("rejects %s mode=test in Production even with implemented capabilities", (prefix) => {
    const key = `${prefix}SyntheticSentinel`.padEnd(180, "X");
    const config = readSaasBillingConfiguration({ ...valid, VERCEL_ENV: "production", NODE_ENV: "production",
      CHASUM_SAAS_STRIPE_SECRET_KEY: key,
    });
    const result = evaluateSaasBillingReadiness(config, {
      provider: "stripe", checkoutImplemented: true, reconciliationImplemented: true,
    });
    expect(result.checkout).toEqual({ available: false, reason: "configuration_unavailable" });
    expect(result.reconciliation).toEqual({ available: false, reason: "configuration_unavailable" });
    expect(config.configurationStatus).toBe("test_requires_nonproduction");
    expect(JSON.stringify({ config, result })).not.toContain(key);
    expect(JSON.stringify({ config, result })).not.toContain(valid.CHASUM_SAAS_STRIPE_WEBHOOK_SECRET);
  });

  it.each(["production", "preview", "development", undefined, "unknown"])("permits disabled mode in %s without capabilities", (runtime) => {
    const config = readSaasBillingConfiguration({ ...valid, VERCEL_ENV: runtime, CHASUM_SAAS_BILLING_MODE: "disabled" });
    expect(config.configurationStatus).toBe("disabled");
    const result = evaluateSaasBillingReadiness(config, {
      provider: "stripe", checkoutImplemented: true, reconciliationImplemented: true,
    });
    expect(result.checkout.available).toBe(false);
    expect(result.reconciliation.available).toBe(false);
  });

  it.each(["test", "live"])("preserves synthetic %s reconciliation using purchase-stop, not whole-mode/key removal", (mode) => {
    const env = { ...valid, VERCEL_ENV: mode === "live" ? "production" : "preview",
      CHASUM_SAAS_BILLING_MODE: mode, CHASUM_SAAS_STRIPE_SECRET_KEY: `sk_${mode}_Synthetic`,
      CHASUM_SAAS_NEW_PURCHASES_ENABLED: "false",
    };
    const implemented = { provider: "stripe", checkoutImplemented: true, reconciliationImplemented: true } as const;
    const result = evaluateSaasBillingReadiness(readSaasBillingConfiguration(env), implemented);
    expect(result.checkout).toEqual({ available: false, reason: "new_purchases_disabled" });
    expect(result.reconciliation.available).toBe(true);
    for (const stopped of [{ ...env, CHASUM_SAAS_BILLING_MODE: "disabled" }, { ...env, CHASUM_SAAS_STRIPE_SECRET_KEY: undefined }]) {
      const unavailable = evaluateSaasBillingReadiness(readSaasBillingConfiguration(stopped), implemented);
      expect(unavailable.checkout.available).toBe(false);
      expect(unavailable.reconciliation.available).toBe(false);
    }
  });

  it.each(["sk_test_Synthetic", "rk_test_Synthetic"])("rejects %s in live mode", (key) => {
    expect(readSaasBillingConfiguration({ ...valid, VERCEL_ENV: "production",
      CHASUM_SAAS_BILLING_MODE: "live", CHASUM_SAAS_STRIPE_SECRET_KEY: key,
    }).configurationStatus).toBe("key_mode_mismatch");
  });

  it.each([undefined, "", "false", "FALSE", "TRUE", "1", "yes", " true ", "garbage", "true"])("only explicit true requests purchases: %s", (flag) => {
    const config = readSaasBillingConfiguration({ ...valid, CHASUM_SAAS_NEW_PURCHASES_ENABLED: flag });
    expect(config.newPurchasesRequested).toBe(flag === "true");
    expect(evaluateSaasBillingReadiness(config).checkout.available).toBe(false);
  });

  it("defaults to disabled, and never serializes raw input or secret sentinels", () => {
    expect(readSaasBillingConfiguration({})).toEqual({ mode: "disabled", runtime: "unknown", configurationStatus: "disabled", newPurchasesRequested: false });
    for (const env of [valid, { ...valid, CHASUM_SAAS_BILLING_MODE: valid.CHASUM_SAAS_STRIPE_SECRET_KEY },
      { ...valid, VERCEL_ENV: valid.CHASUM_SAAS_STRIPE_WEBHOOK_SECRET },
      { ...valid, CHASUM_SAAS_STRIPE_SECRET_KEY: `invalid${valid.CHASUM_SAAS_STRIPE_SECRET_KEY}` }]) {
      const config = readSaasBillingConfiguration(env);
      const serialized = JSON.stringify({ config, diagnostics: evaluateSaasBillingReadiness(config) });
      expect(serialized).not.toContain("Sentinel");
      expect(serialized).not.toContain(valid.CHASUM_SAAS_STRIPE_SECRET_KEY);
      expect(serialized).not.toContain(valid.CHASUM_SAAS_STRIPE_WEBHOOK_SECRET);
      expect(serialized).not.toMatch(/CHASUM_|sk_test_|whsec_/);
    }
  });

  it("preserves the server-only boundary and keeps readiness free of env/secrets/imports", () => {
    const config = readFileSync("lib/billing/saas-configuration.ts", "utf8");
    expect(config).toMatch(/^import "server-only";/);
    expect(config).not.toMatch(/console\.|throw\s|NEXT_PUBLIC_|from ["']@\/lib\/env/);
    expect(readFileSync("lib/billing/saas-readiness.ts", "utf8")).not.toMatch(/^import\s|process\.env|SECRET_KEY|WEBHOOK_SECRET/m);
    function checkClients(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) checkClients(path);
        else if (/\.[jt]sx?$/.test(path)) {
          const source = readFileSync(path, "utf8");
          if (/^["']use client["']/m.test(source)) expect(source, path).not.toContain("saas-configuration");
        }
      }
    }
    for (const root of ["app", "components", "lib"]) checkClients(root);
  });
});
