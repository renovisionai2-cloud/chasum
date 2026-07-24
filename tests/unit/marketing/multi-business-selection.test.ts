import { describe, expect, it } from "vitest";
import {
  fsBuildMultiAck,
  fsBuildMultiPrompt,
  type FsSelectedBusiness,
} from "@/lib/marketing/flagship-summer";
import { createEmptySessionMemory } from "@/lib/website-concierge/session-memory";
import { buildUnderstandingFields } from "@/lib/marketing/meet-summer-intelligence";

describe("multi-business selection helpers", () => {
  it("builds a dual-business acknowledgement", () => {
    const ack = fsBuildMultiAck(["Medical Clinic", "Ultrasound"]);
    expect(ack).toContain("Medical Clinic");
    expect(ack).toContain("Ultrasound");
    expect(ack.toLowerCase()).toContain("both");
  });

  it("builds a multi-business discovery prompt", () => {
    const selections: FsSelectedBusiness[] = [
      {
        id: "medical_clinic",
        label: "Medical Clinic",
        prompt: "I run a medical clinic",
        categoryId: "healthcare",
      },
      {
        id: "ultrasound",
        label: "Ultrasound",
        prompt: "I run an ultrasound clinic",
        categoryId: "healthcare",
      },
    ];
    const prompt = fsBuildMultiPrompt(selections);
    expect(prompt).toContain("Medical Clinic");
    expect(prompt).toContain("Ultrasound");
  });

  it("shows all businessTypes in the understanding profile", () => {
    const memory = {
      ...createEmptySessionMemory(),
      businessTypes: ["Hair Salon", "Medical Spa"],
      businessType: "salon" as const,
    };
    const fields = buildUnderstandingFields(memory, { showPending: true });
    const business = fields.find((f) => f.id === "business");
    expect(business?.discovered).toBe(true);
    expect(business?.value).toBe("Hair Salon · Medical Spa");
  });
});
