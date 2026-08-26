import { describe, expect, it } from "vitest";
import {
  fsBuildMultiPrompt,
  fsConsultationHeading,
  fsOperatingNoun,
  type FsSelectedBusiness,
} from "@/lib/marketing/flagship-summer";
import { buildUnderstandingFields } from "@/lib/marketing/meet-summer-intelligence";
import {
  runDiscoveryEngine,
  selectNextDiscoveryField,
  toDiscoveryProfile,
} from "@/lib/website-concierge/discovery";
import { inferBusinessTypeFromText, createEmptySessionMemory } from "@/lib/website-concierge/session-memory";

const LEAK =
  /ultrasound clinic is not a salon|appointment-based business do you run|specifically for your practice/i;

function lawFirmSelection(): FsSelectedBusiness {
  return {
    id: "law_firm",
    label: "Law Firm",
    prompt: "I run a law firm",
    categoryId: "professional",
  };
}

describe("Meet Summer selected-business context integrity", () => {
  it("keeps Law Firm authoritative and does not leak clinic/salon fallback copy", () => {
    const selection = lawFirmSelection();
    expect(inferBusinessTypeFromText(selection.label)).toBe("law_firm");
    expect(inferBusinessTypeFromText(selection.prompt)).toBe("law_firm");

    const ack = fsBuildMultiPrompt([selection]);
    expect(ack).toBe(
      "Great — I'll tailor Chasum around how your law firm operates.",
    );
    expect(ack).not.toMatch(LEAK);
    expect(fsConsultationHeading(["Law Firm"])).toMatch(/Law Firm/i);
    expect(fsOperatingNoun("Law Firm", "professional")).toBe("law firm");

    const memory = {
      ...createEmptySessionMemory(),
      businessTypes: ["Law Firm"],
      businessType: "law_firm" as const,
      discoveryAskedIds: ["business_type" as const],
      discoveryPhase: "discovering" as const,
    };
    const next = selectNextDiscoveryField(toDiscoveryProfile(memory));
    expect(next?.id).not.toBe("business_type");

    const { result, memory: after } = runDiscoveryEngine({
      userMessage: ack,
      memory,
    });
    expect(after.businessTypes).toEqual(["Law Firm"]);
    expect(after.businessType).toBe("law_firm");
    expect(result?.askedFieldId).not.toBe("business_type");
    expect(result?.message).not.toMatch(LEAK);
    expect(result?.message).not.toMatch(/appointment-based/i);

    const fields = buildUnderstandingFields(after, { showPending: true });
    const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
    expect(byId.industry?.value).toBe("Law Firm");
    expect(byId.businessType?.value).toMatch(/Law Firm/i);
  });

  it("keeps healthcare language on clinic selection and does not use law-firm copy", () => {
    const ack = fsBuildMultiPrompt([
      {
        id: "medical_clinic",
        label: "Medical Clinic",
        prompt: "I run a medical clinic",
        categoryId: "healthcare",
      },
    ]);
    expect(ack).toBe(
      "Great — I'll tailor Chasum around how your practice operates.",
    );
    expect(ack.toLowerCase()).not.toContain("law firm");

    const { result, memory } = runDiscoveryEngine({
      userMessage: ack,
      memory: {
        ...createEmptySessionMemory(),
        businessTypes: ["Medical Clinic"],
        businessType: "clinic",
        discoveryAskedIds: ["business_type"],
        discoveryPhase: "discovering",
      },
    });
    expect(memory.businessTypes).toEqual(["Medical Clinic"]);
    expect(result?.message).not.toMatch(/law firm/i);
    expect(result?.message).not.toMatch(LEAK);
  });

  it("does not give automotive the clinic/salon/law-firm fallback", () => {
    const ack = fsBuildMultiPrompt([
      {
        id: "auto_repair",
        label: "Auto Repair",
        prompt: "I run an auto repair shop",
        categoryId: "automotive",
      },
    ]);
    expect(ack).toBe(
      "Great — I'll tailor Chasum around how your automotive business operates.",
    );
    expect(ack).not.toMatch(/salon|clinic|law firm|practice/i);
    expect(inferBusinessTypeFromText("Auto Repair")).toBe("automotive");

    const { result, memory } = runDiscoveryEngine({
      userMessage: ack,
      memory: {
        ...createEmptySessionMemory(),
        businessTypes: ["Auto Repair"],
        businessType: "automotive",
        discoveryAskedIds: ["business_type"],
        discoveryPhase: "discovering",
      },
    });
    expect(memory.businessTypes).toEqual(["Auto Repair"]);
    expect(result?.message).not.toMatch(LEAK);
    expect(result?.message).not.toMatch(/law firm|ultrasound|salon/i);
  });

  it("preserves multiple selected businesses without leaking hardcoded industry examples", () => {
    const selections: FsSelectedBusiness[] = [
      lawFirmSelection(),
      {
        id: "accounting",
        label: "Accounting",
        prompt: "I run an accounting practice",
        categoryId: "professional",
      },
    ];
    const ack = fsBuildMultiPrompt(selections);
    expect(ack.toLowerCase()).toContain("law firm");
    expect(ack.toLowerCase()).toContain("accounting");
    expect(ack).not.toMatch(LEAK);

    const memory = {
      ...createEmptySessionMemory(),
      businessTypes: ["Law Firm", "Accounting"],
      businessType: "law_firm" as const,
      discoveryAskedIds: ["business_type" as const],
    };
    const { result, memory: after } = runDiscoveryEngine({
      userMessage: ack,
      memory,
    });
    expect(after.businessTypes).toEqual(["Law Firm", "Accounting"]);
    expect(result?.askedFieldId).not.toBe("business_type");
    expect(result?.message).not.toMatch(LEAK);

    const fields = buildUnderstandingFields(after, { showPending: true });
    const business = fields.find((f) => f.id === "industry");
    expect(business?.value).toBe("Law Firm · Accounting");
  });
});
