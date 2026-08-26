import { describe, expect, it } from "vitest";
import {
  fsBuildMultiPrompt,
  fsConsultationHeading,
  fsOperatingNoun,
  type FsSelectedBusiness,
} from "@/lib/marketing/flagship-summer";
import {
  buildThinkingCues,
  buildUnderstandingFields,
  presentFlagshipRecommendation,
} from "@/lib/marketing/meet-summer-intelligence";
import {
  contextualizeDiscoveryField,
  extractDiscoveryFacts,
  playbookForProfile,
  runDiscoveryEngine,
  selectNextDiscoveryField,
  toDiscoveryProfile,
} from "@/lib/website-concierge/discovery";
import { fieldById } from "@/lib/website-concierge/discovery/fields";
import { inferBusinessTypeFromText, createEmptySessionMemory } from "@/lib/website-concierge/session-memory";
import type { SessionMemory } from "@/lib/website-concierge/types";

const LEAK =
  /ultrasound clinic is not a salon|appointment-based business do you run|specifically for your practice/i;

const CLINIC_VOLUME_LEAK =
  /appointment volume|no-show risk|busy clinic|appointments do you book/i;

function lawFirmSelection(): FsSelectedBusiness {
  return {
    id: "law_firm",
    label: "Law Firm",
    prompt: "I run a law firm",
    categoryId: "professional",
  };
}

function seededMemory(partial: Partial<SessionMemory>): SessionMemory {
  return {
    ...createEmptySessionMemory(),
    discoveryPhase: "discovering",
    discoveryAskedIds: ["business_type"],
    ...partial,
  };
}

function continueUntilField(
  memory: SessionMemory,
  fieldId: string,
  answers: string[],
) {
  let current = memory;
  let last = runDiscoveryEngine({
    userMessage: answers[0] ?? "Continue",
    memory: current,
  });
  current = last.memory;
  if (last.result?.askedFieldId === fieldId) return last;

  for (const answer of answers.slice(1)) {
    last = runDiscoveryEngine({ userMessage: answer, memory: current });
    current = last.memory;
    if (last.result?.askedFieldId === fieldId) return last;
    if (last.result?.discoveryPhase === "recommending") return last;
  }
  return last;
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

describe("Meet Summer full-conversation industry context", () => {
  it("keeps Law Firm context through volume, goals, recommendations, and What I've learned", () => {
    const ack = fsBuildMultiPrompt([lawFirmSelection()]);
    let { result, memory } = runDiscoveryEngine({
      userMessage: ack,
      memory: seededMemory({
        businessTypes: ["Law Firm"],
        businessType: "law_firm",
      }),
    });
    expect(result?.message).not.toMatch(LEAK);
    expect(result?.askedFieldId).toBe("challenges");
    expect(result?.suggestions).toContain("Admin overload");
    expect(result?.suggestions).not.toContain("No-shows");

    ({ result, memory } = runDiscoveryEngine({
      userMessage: "Admin overload",
      memory,
    }));
    expect(result?.askedFieldId).toBe("employee_count");
    expect(result?.message).not.toMatch(CLINIC_VOLUME_LEAK);

    ({ result, memory } = runDiscoveryEngine({
      userMessage: "2–5",
      memory,
    }));
    expect(result?.askedFieldId).toBe("location_count");

    ({ result, memory } = runDiscoveryEngine({
      userMessage: "One location",
      memory,
    }));
    expect(result?.askedFieldId).toBe("current_software");
    expect(result?.message).not.toMatch(/scheduling or booking/i);
    expect(result?.suggestions).toContain("Practice management software");

    ({ result, memory } = runDiscoveryEngine({
      userMessage: "Spreadsheets",
      memory,
    }));
    expect(result?.askedFieldId).toBe("monthly_volume");
    expect(result?.message).toMatch(
      /new client inquiries, consultations, or active matters/i,
    );
    expect(result?.message).not.toMatch(CLINIC_VOLUME_LEAK);
    expect(result?.suggestions).toEqual([
      "Under 50",
      "50–200",
      "200–500",
      "500+",
    ]);

    ({ result, memory } = runDiscoveryEngine({
      userMessage: "50–200",
      memory,
    }));
    expect(result?.askedFieldId).toBe("goals");
    expect(result?.suggestions).toContain("More clients");
    expect(result?.suggestions).toContain("Improve client intake");
    expect(result?.suggestions).not.toContain("More bookings");
    expect(result?.message).not.toMatch(/fewer no-shows/i);

    ({ result, memory } = runDiscoveryEngine({
      userMessage: "More clients",
      memory,
    }));
    expect(result?.discoveryPhase).toBe("recommending");
    expect(result?.message).toMatch(/law firm/i);
    expect(result?.message).not.toMatch(
      /Scheduling & booking|appointment businesses|busy clinic|no-shows/i,
    );
    expect(result?.message).toMatch(/intake|client|firm/i);
    expect(memory.recommendationsMade).not.toContain("calendar");
    expect(memory.recommendationsMade).not.toContain("deposits");
    expect(memory.businessTypes).toEqual(["Law Firm"]);

    const fields = buildUnderstandingFields(memory, { showPending: true });
    const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
    expect(byId.industry?.value).toBe("Law Firm");
    expect(byId.businessType?.value).toBe("Law Firm");
    expect(byId.goals?.value).toMatch(/more clients/i);

    const recCopy = presentFlagshipRecommendation("crm", memory);
    expect(recCopy.why).toMatch(/intake|matter|follow-up/i);
    expect(recCopy.why).not.toMatch(/no-shows|book needs filling/i);

    const cues = buildThinkingCues(memory);
    expect(cues.some((c) => /firm activity/i.test(c.label))).toBe(true);
    expect(cues.some((c) => /appointment volume/i.test(c.label))).toBe(false);
  });

  it("keeps Massage Therapy appointment language and a coherent customer-facing label", () => {
    const volume = contextualizeDiscoveryField(fieldById("monthly_volume")!, {
      businessType: "massage",
      businessTypes: ["Massage Therapy"],
    });
    expect(volume.question).toMatch(/appointments/i);
    expect(volume.why).toMatch(/no-show/i);

    const goals = contextualizeDiscoveryField(fieldById("goals")!, {
      businessType: "massage",
      businessTypes: ["Massage Therapy"],
    });
    expect(goals.suggestions).toContain("More bookings");

    const memory = seededMemory({
      businessTypes: ["Massage Therapy"],
      businessType: "massage",
      employeeCount: "2–5",
      locationCount: "One location",
      currentSoftware: "Fresha",
      monthlyVolume: "50–200",
      challenges: ["no-shows"],
      goals: ["more bookings"],
      discoveryAskedIds: [
        "business_type",
        "challenges",
        "employee_count",
        "location_count",
        "current_software",
        "monthly_volume",
        "goals",
      ],
    });
    const fields = buildUnderstandingFields(memory, { showPending: true });
    const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
    expect(byId.industry?.value).toBe("Massage Therapy");
    expect(byId.businessType?.value).toBe("Massage Therapy");
    expect(byId.businessType?.value).not.toBe("Massage");

    const { result, memory: after } = runDiscoveryEngine({
      userMessage: "More bookings",
      memory,
    });
    expect(after.businessTypes).toEqual(["Massage Therapy"]);
    expect(result?.discoveryPhase).toBe("recommending");
    expect(result?.message).toMatch(/massage therapy/i);
    expect(playbookForProfile(after).some((p) => p.topicId === "deposits")).toBe(
      true,
    );
  });

  it("keeps automotive wording free of clinic, law-firm, and salon leakage", () => {
    const volume = contextualizeDiscoveryField(fieldById("monthly_volume")!, {
      businessType: "automotive",
      businessTypes: ["Auto Repair"],
    });
    expect(volume.question).toMatch(/service jobs/i);
    expect(volume.question).not.toMatch(CLINIC_VOLUME_LEAK);
    expect(volume.helps).not.toMatch(/busy clinic/i);

    const { result, memory } = continueUntilField(
      seededMemory({
        businessTypes: ["Auto Repair"],
        businessType: "automotive",
      }),
      "monthly_volume",
      [
        "Great — I'll tailor Chasum around how your automotive business operates.",
        "Customer updates",
        "2–5",
        "One location",
        "Spreadsheets",
      ],
    );
    expect(result?.askedFieldId).toBe("monthly_volume");
    expect(result?.message).toMatch(/service jobs/i);
    expect(result?.message).not.toMatch(/law firm|ultrasound/i);
    expect(result?.message).not.toMatch(/\bsalon\b/i);
    expect(memory.businessTypes).toEqual(["Auto Repair"]);

    const recs = playbookForProfile(memory);
    expect(recs[0]?.topicId).not.toBe("calendar");
    expect(recs.some((p) => /clinic|salon|no-show/i.test(p.why))).toBe(false);
  });

  it("uses neutral wording for mixed businesses instead of a clinic/salon fallback", () => {
    const volume = contextualizeDiscoveryField(fieldById("monthly_volume")!, {
      businessType: "law_firm",
      businessTypes: ["Law Firm", "Auto Repair"],
    });
    expect(volume.question).toMatch(/customer activity/i);
    expect(volume.question).not.toMatch(CLINIC_VOLUME_LEAK);
    expect(volume.helps).toMatch(/not a one-size industry template/i);

    const { result, memory } = runDiscoveryEngine({
      userMessage: "Admin overload",
      memory: seededMemory({
        businessTypes: ["Law Firm", "Auto Repair"],
        businessType: "law_firm",
      }),
    });
    expect(memory.businessTypes).toEqual(["Law Firm", "Auto Repair"]);
    expect(result?.message).not.toMatch(CLINIC_VOLUME_LEAK);
    expect(result?.suggestions).not.toEqual(
      expect.arrayContaining(["No-shows", "Front desk overload", "Rebooking"]),
    );

    const playbook = playbookForProfile(memory);
    expect(playbook.some((p) => p.topicId === "deposits")).toBe(false);
    expect(playbook.some((p) => /appointment businesses/i.test(p.why))).toBe(
      false,
    );

    const fields = buildUnderstandingFields(memory, { showPending: true });
    expect(fields.find((f) => f.id === "industry")?.value).toBe(
      "Law Firm · Auto Repair",
    );
    expect(fields.find((f) => f.id === "businessType")?.value).toBe(
      "Law Firm · Auto Repair",
    );
  });

  it("extracts law-firm goal chips without normalizing them to more bookings", () => {
    const facts = extractDiscoveryFacts("More clients");
    expect(facts.goals).toContain("more clients");
    expect(facts.goals).not.toContain("more bookings");
  });
});

