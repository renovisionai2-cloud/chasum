import { describe, expect, it } from "vitest";
import { newBusinessIdentitySchema } from "@/lib/tenant-identity/input";
const valid = {
  name: "New Studio",
  legalName: "",
  email: "user@example.test",
  phone: "+1 (416) 555-0100",
  website: "",
  city: "Toronto",
  region: "Ontario",
  country: "ca",
  requestedSlug: "",
  confirmation: "yes",
};
describe("bounded identity input", () => {
  it("accepts optional identity fields and normalizes country/email", () => {
    expect(
      newBusinessIdentitySchema.parse({ ...valid, email: "USER@EXAMPLE.TEST" }),
    ).toMatchObject({ country: "CA", email: "user@example.test" });
  });
  it.each([
    "https://user:secret@example.test",
    "javascript:alert(1)",
    "https://example.test@127.0.0.1",
  ])("rejects unsafe website %s", (website) => {
    expect(
      newBusinessIdentitySchema.safeParse({ ...valid, website }).success,
    ).toBe(false);
  });
  it("drops website path/query and accepts normal hostname", () => {
    expect(
      newBusinessIdentitySchema.parse({
        ...valid,
        website: "https://www.example.test/path?secret=token",
      }).website,
    ).toBe("https://www.example.test");
  });
  it.each([
    { requestedSlug: "x" },
    { requestedSlug: "bad slug" },
    { phone: "1234567890123456" },
    { confirmation: "false" },
  ])("rejects invalid bounded input %j", (change) => {
    expect(
      newBusinessIdentitySchema.safeParse({ ...valid, ...change }).success,
    ).toBe(false);
  });
});
