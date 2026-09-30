import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SummerReceptionWorkspace } from "@/components/summer/summer-reception-workspace";
import {
  confirmSummerBookingAction,
  sendSummerMessage,
  summerRecognizeCustomerAction,
} from "@/lib/actions/summer";
import type { SummerBookingOption, SummerTurnResult } from "@/lib/summer/types";

vi.mock("@/lib/actions/summer", () => ({
  sendSummerMessage: vi.fn(),
  confirmSummerBookingAction: vi.fn(),
  rescheduleSummerAppointmentAction: vi.fn(),
  cancelSummerAppointmentAction: vi.fn(),
  summerRecognizeCustomerAction: vi.fn(),
}));

const option: SummerBookingOption = Object.freeze({
  id: "option-brampton",
  locationId: "7a175a5c-26ba-4c6b-9f66-d284852043ef",
  locationName: "Brampton Test Location",
  serviceId: "service-consultation",
  serviceName: "Consultation",
  staffId: "staff-alex",
  staffName: "Alex Test",
  startIso: "2026-10-01T14:00:00.000Z",
  endIso: "2026-10-01T14:30:00.000Z",
  dateLabel: "October 1, 2026",
  timeLabel: "10:00 AM",
  price: 50,
});
const confirmationReply = "Your appointment is confirmed.";

function turn(overrides: Partial<SummerTurnResult> = {}): SummerTurnResult {
  return {
    conversationId: "conversation-test",
    reply: "Choose an opening to confirm.",
    intent: "booking",
    provider: "test",
    citations: [],
    bookingOptions: [option],
    appointmentCards: [],
    confirmation: null,
    conflicts: [],
    escalated: false,
    escalationReason: null,
    followUpCreated: false,
    loggedToCrm: false,
    customerRecognized: true,
    customerDisplayName: "Guest Test",
    customerId: "customer-test",
    suggestions: [],
    ...overrides,
  };
}

const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);

beforeAll(() => {
  // jsdom has no scrolling implementation; keep the real component effects.
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterAll(() => {
  if (originalScrollIntoView) {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  }
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendSummerMessage).mockResolvedValue(turn());
  vi.mocked(confirmSummerBookingAction).mockResolvedValue({
    ok: true,
    reply: confirmationReply,
  });
});

afterEach(cleanup);

async function requestOptions() {
  const user = userEvent.setup();
  render(
    <SummerReceptionWorkspace
      businessName="Test Business"
      knowledgeReady={{ serviceCount: 1, employeeCount: 1, hoursConfigured: 7 }}
    />,
  );
  await user.type(screen.getByRole("textbox", { name: "Message Summer" }), "Book a consultation");
  await user.click(screen.getByRole("button", { name: "Send message" }));
  return user;
}

async function findConfirmationBlock() {
  const replyMatches = await screen.findAllByText(confirmationReply);
  const confirmationReplyText = replyMatches.find((element) => element.tagName === "P");
  expect(confirmationReplyText).toBeDefined();
  return {
    confirmationReplyText: confirmationReplyText!,
    confirmation: confirmationReplyText!.parentElement!,
  };
}

describe("Summer Location disclosure", () => {
  it("shows the supplied Location before booking and independently in the successful confirmation", async () => {
    const user = await requestOptions();
    const card = await screen.findByRole("button", { name: /Confirm booking/ });
    expect(within(card).getByText("Location · Brampton Test Location")).toBeVisible();
    expect(within(card).getByText(option.serviceName)).toBeVisible();
    expect(within(card).getByText(`${option.dateLabel} · ${option.timeLabel}`)).toBeVisible();
    expect(within(card).getByText(/Alex Test/)).toBeVisible();
    expect(confirmSummerBookingAction).not.toHaveBeenCalled();

    await user.click(card);

    const { confirmationReplyText, confirmation } = await findConfirmationBlock();
    expect(confirmationReplyText).toBeVisible();
    expect(within(confirmation).getByText("Location · Brampton Test Location")).toBeVisible();
    expect(confirmationReply).not.toContain(option.locationName);
    expect(confirmSummerBookingAction).toHaveBeenCalledExactlyOnceWith({
      option,
      customerId: "customer-test",
      conversationId: "conversation-test",
    });
    expect(vi.mocked(confirmSummerBookingAction).mock.calls[0][0].option).toBe(option);
    expect(sendSummerMessage).toHaveBeenCalledTimes(1);
    expect(summerRecognizeCustomerAction).not.toHaveBeenCalled();
  });

  it("uses the selected option's Location when multiple options have different Locations", async () => {
    const otherOption = Object.freeze({
      ...option,
      id: "option-other",
      locationId: "3bffbfad-c564-476d-93a8-dc37e7e174df",
      locationName: "Other Test Location",
    });
    vi.mocked(sendSummerMessage).mockResolvedValue(turn({ bookingOptions: [otherOption, option] }));
    const user = await requestOptions();
    expect(await screen.findByRole("button", { name: /Location · Other Test Location/ })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /Location · Brampton Test Location/ }));

    const { confirmation } = await findConfirmationBlock();
    expect(within(confirmation).getByText("Location · Brampton Test Location")).toBeVisible();
    expect(within(confirmation).queryByText(/Other Test Location/)).not.toBeInTheDocument();
    expect(vi.mocked(confirmSummerBookingAction).mock.calls[0][0].option).toBe(option);
  });

  it("omits Location disclosure when the selected option has no locationName", async () => {
    const { locationName: omittedName, ...unnamedOption } = option;
    vi.mocked(sendSummerMessage).mockResolvedValue(turn({ bookingOptions: [unnamedOption] }));
    const user = await requestOptions();
    const card = await screen.findByRole("button", { name: /Confirm booking/ });
    expect(within(card).queryByText(/Location/)).not.toBeInTheDocument();
    await user.click(card);

    const { confirmationReplyText, confirmation } = await findConfirmationBlock();
    expect(confirmationReplyText).toBeVisible();
    expect(within(confirmation).queryByText(/Location/)).not.toBeInTheDocument();
    expect(screen.queryByText(omittedName, { exact: false })).not.toBeInTheDocument();
    expect(vi.mocked(confirmSummerBookingAction).mock.calls[0][0].option).toBe(unnamedOption);
  });

  it("discloses Location on the shared reschedule option cards", async () => {
    vi.mocked(sendSummerMessage)
      .mockResolvedValueOnce(turn({
        bookingOptions: [],
        appointmentCards: [{
          id: "appointment-test",
          startIso: option.startIso,
          serviceName: option.serviceName,
          staffName: option.staffName,
          status: "confirmed",
        }],
      }))
      .mockResolvedValueOnce(turn({ intent: "reschedule" }));
    const user = await requestOptions();
    await user.click(await screen.findByRole("button", { name: "Reschedule" }));

    const card = await screen.findByRole("button", { name: /Confirm reschedule/ });
    expect(within(card).getByText("Location · Brampton Test Location")).toBeVisible();
    expect(confirmSummerBookingAction).not.toHaveBeenCalled();
  });
});
