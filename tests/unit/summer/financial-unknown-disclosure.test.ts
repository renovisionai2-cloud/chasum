import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ snapshot: vi.fn() }));
vi.mock("@/lib/ai-receptionist/service", () => ({ getAiReceptionistService: () => ({ ensureConversation: async () => null }) }));
vi.mock("@/lib/communication", () => ({ getCommunicationService: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => {
  const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { ai_settings: {} }, error: null }) };
  return { from: () => q };
} }));
vi.mock("@/lib/summer/tools", () => ({
  summerLoadKnowledge: async () => ({ businessName: "Test Business", locations: [], services: [], staff: [] }),
  summerLookupCustomer: async () => ({ customerId: "customer", displayName: "Test Customer" }),
  summerPreviewForService: vi.fn(), upcomingToCards: vi.fn(),
}));
vi.mock("@/lib/commerce", () => ({ getSummerCommerceSnapshot: mocks.snapshot }));
beforeEach(() => mocks.snapshot.mockResolvedValue({ financialStatus: "source_disagreement", outstandingBalanceCents: null, lifetimeSpendCents: null, depositsCents: null, storeCreditCents: 0, openInvoiceCount: 0, openInvoices: [] }));
import { handleSummerTurn } from "@/lib/summer/orchestrator";
it("Summer states unknown totals rather than converting them into zero balances", async () => {
  const result = await handleSummerTurn({ businessId: "biz", locationId: null, message: "What is my outstanding balance?" });
  expect(result.intent).toBe("commerce");
  expect(result.reply).toContain("Outstanding balance: unknown");
  expect(result.reply).toContain("Lifetime spend: unknown");
  expect(result.reply).toContain("Deposits on file: unknown");
  expect(result.reply).not.toContain("$0.00");
  expect(result.reply).toContain("account totals need review");
});

it("Summer asks for review when current sources fail or are truncated", async () => {
  mocks.snapshot.mockResolvedValue({ financialStatus: "unknown", outstandingBalanceCents: null, lifetimeSpendCents: null, depositsCents: null, storeCreditCents: 0, openInvoiceCount: 0, openInvoices: [] });
  const result = await handleSummerTurn({ businessId: "biz", locationId: null, message: "What is my outstanding balance?" });
  expect(result.reply).toContain("Outstanding balance: unknown");
  expect(result.reply).toContain("account totals need review");
  expect(result.reply).not.toContain("$0.00");
});

it.each([0, 1300])("Summer states matching current balance %s but keeps history unknown", async outstandingBalanceCents => {
  mocks.snapshot.mockResolvedValue({ financialStatus: "unknown", outstandingBalanceCents, lifetimeSpendCents: null, depositsCents: null, storeCreditCents: 0, openInvoiceCount: 0, openInvoices: [] });
  const result = await handleSummerTurn({ businessId: "biz", locationId: null, message: "What is my outstanding balance?" });
  expect(result.reply).toContain(`Outstanding balance: $${(outstandingBalanceCents / 100).toFixed(2)}`);
  expect(result.reply).not.toContain("Outstanding balance: unknown");
  expect(result.reply).toContain("Lifetime spend: unknown");
  expect(result.reply).toContain("Deposits on file: unknown");
  expect(result.reply).not.toContain("need review");
});
