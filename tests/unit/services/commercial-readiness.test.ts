import { beforeEach, expect, it, vi } from "vitest";
import { updateService } from "@/lib/actions/services";
import { commercialReviewMessage } from "@/lib/services/commercial-readiness";
const mock = vi.hoisted(() => ({ from: vi.fn(), update: vi.fn(), result: { error: { message: "SERVICE_COMMERCIAL_REVIEW_REQUIRED" } } }));
vi.mock("@/lib/actions/business", () => ({ getOrCreateBusiness: async () => ({ id: "tenant" }) }));
vi.mock("@/lib/actions/location", () => ({ getActiveLocationId: async () => "location", getLocationScope: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mock.from }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
beforeEach(() => { vi.clearAllMocks(); const q = { update: mock.update, eq: vi.fn().mockReturnThis(), then: (resolve: (value: unknown) => unknown) => Promise.resolve(mock.result).then(resolve) }; mock.update.mockReturnValue(q); mock.from.mockReturnValue(q); });
it("returns safe product wording and never automatically reviews imported settings", async () => {
  const form = new FormData(); form.set("id", "service"); form.set("booking_visibility", "online");
  expect(await updateService({}, form)).toEqual({ error: commercialReviewMessage });
  expect(mock.update.mock.calls[0][0]).not.toHaveProperty("commercial_settings_reviewed");
  expect(mock.from).toHaveBeenCalledTimes(1);
});
it("requires explicit review confirmation to submit readiness", async () => {
  const form = new FormData(); form.set("id", "service"); form.set("commercial_settings_reviewed", "on");
  await updateService({}, form);
  expect(mock.update.mock.calls[0][0]).toMatchObject({ commercial_settings_reviewed: true });
});
