import { describe, expect, it } from "vitest";
import {
  detectSummerIntent,
  matchServiceFromMessage,
  matchStaffFromMessage,
} from "@/lib/summer/intents";

describe("Summer intents", () => {
  it("detects booking and cancel intents", () => {
    expect(detectSummerIntent("I want to book an appointment")).toBe("booking");
    expect(detectSummerIntent("Please cancel my booking")).toBe("cancel");
    expect(detectSummerIntent("I need to speak to a human")).toBe("escalate");
  });

  it("matches grounded catalog names only", () => {
    const services = [
      { id: "1", name: "Gel Manicure" },
      { id: "2", name: "Haircut" },
    ];
    expect(matchServiceFromMessage("Book a gel manicure please", services)?.id).toBe(
      "1",
    );
    expect(matchServiceFromMessage("Book a massage", services)).toBeNull();
  });

  it("matches staff names from message", () => {
    const staff = [
      { id: "a", name: "Alex Rivera" },
      { id: "b", name: "Sam Chen" },
    ];
    expect(matchStaffFromMessage("with Alex Rivera", staff)?.id).toBe("a");
  });
});
