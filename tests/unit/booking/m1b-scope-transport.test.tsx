import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ts from "typescript";
import { ReceptionWorkspace } from "@/components/reception/reception-workspace";
import type { LocationScope } from "@/lib/location/constants";

const mocks = vi.hoisted(() => ({ sheet: vi.fn(), quick: vi.fn(), mounts: vi.fn(), readiness: vi.fn(), refresh: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh, push: vi.fn() }), usePathname: () => "/dashboard/calendar", useSearchParams: () => new URLSearchParams() }));
vi.mock("@/providers/toast-provider", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/booking/location-readiness", () => ({ getLocationBookingReadiness: (...args: unknown[]) => { mocks.readiness(...args); return { state: "ready" }; } }));
vi.mock("@/components/booking-sheet", () => ({ BookingSheet: function Sheet(props: { scope: LocationScope }) {
  mocks.sheet(props);
  useEffect(() => { mocks.mounts(); }, []);
  return null;
} }));
vi.mock("@/components/reception/quick-appointment", () => ({ QuickAppointmentForm: (props: { scope: LocationScope }) => { mocks.quick(props); return null; } }));
vi.mock("@/components/day-view/morning-brief", () => ({ MorningBrief: () => null }));
vi.mock("@/components/calendar/calendar-toolbar", () => ({ CalendarToolbar: ({ onOpenReception }: { onOpenReception?: () => void }) => onOpenReception ? <button aria-label="Open reception panel" onClick={onOpenReception}>Reception tools</button> : null }));
vi.mock("@/components/calendar/calendar-views", () => ({ MonthView: () => null, WeekView: () => null }));
vi.mock("@/components/calendar/calendar-views-extended", () => ({ AgendaView: () => null, ResourceView: () => null, TimelineView: () => null }));
vi.mock("@/components/day-view/day-control-center", () => ({ DayControlCenter: () => null, DayAgendaList: () => null }));
vi.mock("@/components/day-view/appointment-drawer", () => ({ AppointmentDrawer: () => null }));
vi.mock("@/components/reception/customer-search", () => ({ CustomerSearch: () => null }));
vi.mock("@/components/reception/customer-preview", () => ({ CustomerPreview: () => null }));
vi.mock("@/components/reception/next-slot-card", () => ({ NextSlotCard: () => null }));
vi.mock("@/components/reception/today-notes", () => ({ TodayNotes: () => null }));
vi.mock("@/components/reception/ai-suggestions-card", () => ({ AiSuggestionsCard: () => null }));
vi.mock("@/components/reception/reception-waitlist-panel", () => ({ ReceptionWaitlistPanel: () => null }));
vi.mock("@/components/reception/quick-action-dialogs", () => ({ BlockTimeDialog: () => null, InternalNoteDialog: () => null }));
vi.mock("@/components/reception/quick-actions-fab", () => ({ QuickActionsFab: () => null }));
vi.mock("@/components/reception/reception-shortcuts", () => ({ ReceptionShortcuts: () => null }));
vi.mock("@/lib/actions/appointments", () => ({ rescheduleAppointment: vi.fn(), resizeAppointment: vi.fn(), setAppointmentStatus: vi.fn() }));
vi.mock("@/lib/actions/booking-engine", () => ({ duplicateAppointment: vi.fn(), undoLastAppointmentChange: vi.fn() }));
vi.mock("@/lib/actions/scheduling", () => ({ getDashboardAvailableSlots: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1366 });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
});
afterEach(cleanup);
function props(scope: LocationScope): ComponentProps<typeof ReceptionWorkspace> {
  return { scope, brief: {} as ComponentProps<typeof ReceptionWorkspace>["brief"], insights: [], appointments: [], services: [], staff: [], customers: [], locations: [], initialDate: "2026-10-01", initialView: "day", openBookOnLoad: true };
}

describe("M1B required canonical scope transport", () => {
  it.each<LocationScope>([{ mode: "single", locationId: "branch" }, { mode: "all" }])("T1–T3 forwards the same object through both Calendar/Reception chains: %j", async (scope) => {
    render(<ReceptionWorkspace {...props(scope)} />);
    expect(mocks.quick).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Open reception panel" })[0]);
    await waitFor(() => expect(mocks.quick).toHaveBeenCalled());
    expect(mocks.sheet.mock.lastCall?.[0].scope).toBe(scope);
    expect(mocks.quick.mock.lastCall?.[0].scope).toBe(scope);
    expect(mocks.readiness).toHaveBeenLastCalledWith([], [], scope.mode === "single" ? scope.locationId : null);
    for (const spy of [mocks.sheet, mocks.quick]) {
      expect(spy.mock.lastCall?.[0]).not.toHaveProperty("selectedLocationId");
      expect(spy.mock.lastCall?.[0]).not.toHaveProperty("defaultLocationId");
    }
  });
  it("T6 remounts BookingSheet on named → ALL → named workspace changes", () => {
    const { rerender } = render(<ReceptionWorkspace {...props({ mode: "single", locationId: "a" })} />);
    const initialMounts = mocks.mounts.mock.calls.length;
    rerender(<ReceptionWorkspace {...props({ mode: "all" })} />);
    expect(mocks.mounts).toHaveBeenCalledTimes(initialMounts + 1);
    rerender(<ReceptionWorkspace {...props({ mode: "single", locationId: "b" })} />);
    expect(mocks.mounts).toHaveBeenCalledTimes(initialMounts + 2);
  });
  it("T4/T5/T8/T9 keeps one required canonical prop at every hop and only local legacy derivation", () => {
    const paths = ["components/reception/reception-workspace.tsx", "components/calendar/calendar-client.tsx", "components/reception/reception-panel.tsx", "components/reception/quick-appointment.tsx", "components/booking-sheet/booking-sheet.tsx", "components/crm/customer-profile.tsx"];
    for (const path of paths) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain('import type { LocationScope } from "@/lib/location/constants"');
      expect(source).toContain("scope: LocationScope;");
      expect(source).not.toMatch(/scope\??:\s*LocationScope\s*\|/);
      expect(source).not.toContain("scope =");
      expect(source).not.toContain("scope?:");
      expect(source).not.toMatch(/(?:selectedLocationId|defaultLocationId)\??:/);
      expect(source).not.toContain("setLocationScope");
    }
    const calendar = readFileSync("components/calendar/calendar-client.tsx", "utf8");
    expect(calendar).toContain('const selectedLocationId = scope.mode === "single" ? scope.locationId : null;');
    // Verify the actual component boundary, not the number of local references.
    // Calendar drafts may legitimately reuse the derived Location ID.
    const ast = ts.createSourceFile("calendar-client.tsx", calendar, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const consumers = new Map<string, ts.JsxAttributes[]>();
    function visit(node: ts.Node) {
      if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        const name = node.tagName.getText(ast);
        if (["BookingSheet", "ReceptionPanel"].includes(name)) {
          consumers.set(name, [...(consumers.get(name) ?? []), node.attributes]);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    expect([...consumers.keys()].sort()).toEqual(["BookingSheet", "ReceptionPanel"]);
    for (const attributes of [...consumers.values()].flat()) {
      const scopeAttributes = attributes.properties.filter((prop) => ts.isJsxAttribute(prop) && prop.name.getText(ast) === "scope");
      expect(scopeAttributes).toHaveLength(1);
      expect(scopeAttributes[0].getText(ast)).toBe("scope={scope}");
      expect(attributes.properties.some(ts.isJsxSpreadAttribute)).toBe(false);
      for (const prop of attributes.properties) {
        if (ts.isJsxAttribute(prop)) expect(prop.name.getText(ast)).not.toMatch(/^(selectedLocationId|defaultLocationId)$/);
      }
    }
    for (const page of ["app/(dashboard)/dashboard/calendar/page.tsx", "app/(dashboard)/dashboard/clients/[id]/page.tsx"]) {
      const source = readFileSync(page, "utf8");
      expect(source).toContain("getLocationScope()");
      expect(source).toContain("scope={scope}");
    }
    expect(readFileSync("components/crm/customer-profile.tsx", "utf8")).toContain("scope={scope}");
  });
});
