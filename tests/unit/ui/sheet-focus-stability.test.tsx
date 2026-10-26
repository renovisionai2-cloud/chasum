import { useEffect, useState } from "react";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sheet } from "@/components/ui/sheet";

let bumpParent = () => {};

function stubMatchMedia(desktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: desktop && query.includes("min-width: 768px"),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  document.body.style.overflow = "";
  vi.unstubAllGlobals();
});

async function flushFocus() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function NotesSheet({
  desktop = true,
  preferred = false,
}: {
  desktop?: boolean;
  preferred?: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    bumpParent = () => setEpoch((value) => value + 1);
  }, [epoch]);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(true);
  const [submits, setSubmits] = useState(0);

  return (
    <div>
      <button type="button" onClick={() => setPending(true)}>
        Mark pending
      </button>
      <button type="button" onClick={() => setPending(false)}>
        Clear pending
      </button>
      <button type="button" onClick={() => setOpen(true)}>
        Reopen
      </button>
      <output data-testid="open-state">{open ? "open" : "closed"}</output>
      <output data-testid="epoch">{epoch}</output>
      <output data-testid="submits">{submits}</output>
      <Sheet
        open={open}
        resizable={desktop}
        onClose={() => {
          void epoch;
          if (pending) return;
          setOpen(false);
        }}
        title="New booking"
        description="Customer · Appointment · Time · Review"
        headerActions={
          <button type="button" aria-label="Quick actions">
            Actions
          </button>
        }
        footer={
          <button type="submit" form="booking-notes-form">
            Confirm appointment
          </button>
        }
      >
        {preferred ? (
          <input
            id="preferred-target"
            data-sheet-autofocus
            aria-label="Preferred target"
          />
        ) : null}
        <form
          id="booking-notes-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmits((count) => count + 1);
          }}
        >
          <label htmlFor="bs-notes">Notes</label>
          <textarea
            id="bs-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </form>
      </Sheet>
    </div>
  );
}

function notesField() {
  return document.getElementById("bs-notes") as HTMLTextAreaElement;
}

async function focusNotes() {
  await flushFocus();
  await flushFocus();
  const notes = notesField();
  notes.focus();
  expect(document.activeElement).toBe(notes);
  return notes;
}

describe("sheet focus stability", () => {
  it("keeps the same notes node and text when one character used to move focus", async () => {
    render(<NotesSheet />);
    const notes = await focusNotes();
    const node = notes;

    fireEvent.change(notes, { target: { value: "A" } });
    await flushFocus();

    const after = notesField();
    expect(after).toBe(node);
    expect(after.value).toBe("A");
    expect(document.activeElement).toBe(after);
  });

  it("keeps focus through a full sentence on a desktop-width sheet", async () => {
    render(<NotesSheet desktop />);
    const notes = await focusNotes();
    let text = "";
    for (const character of "Baby arrives at 2.") {
      text += character;
      fireEvent.change(notes, { target: { value: text } });
      await flushFocus();
      expect(document.activeElement).toBe(notes);
    }
    expect(notes.value).toBe("Baby arrives at 2.");
    expect(notesField()).toBe(notes);
  });

  it("keeps focus through a sentence on a phone-width sheet", async () => {
    stubMatchMedia(false);
    render(<NotesSheet desktop={false} />);
    const notes = await focusNotes();
    let text = "";
    for (const character of "Front desk note") {
      text += character;
      fireEvent.change(notes, { target: { value: text } });
      await flushFocus();
      expect(document.activeElement).toBe(notes);
    }
    expect(notes.value).toBe("Front desk note");
  });

  it("keeps focus for backspace, delete, mid-text replacement, and paste", async () => {
    render(<NotesSheet />);
    const notes = await focusNotes();

    fireEvent.change(notes, { target: { value: "Hello" } });
    await flushFocus();
    fireEvent.change(notes, { target: { value: "Hell" } });
    await flushFocus();
    fireEvent.change(notes, { target: { value: "Hel" } });
    await flushFocus();
    expect(document.activeElement).toBe(notes);
    expect(notes.value).toBe("Hel");

    fireEvent.change(notes, { target: { value: "Baby arrives at 2." } });
    await flushFocus();
    notes.setSelectionRange(5, 12);
    expect(notes.selectionStart).toBe(5);
    expect(notes.selectionEnd).toBe(12);
    fireEvent.change(notes, { target: { value: "Baby noon at 2." } });
    await flushFocus();
    expect(document.activeElement).toBe(notes);
    expect(notes.value).toBe("Baby noon at 2.");
    expect(notesField()).toBe(notes);

    fireEvent.change(notes, {
      target: {
        value: "Baby noon at 2. Bring the car seat. Call on arrival.",
      },
    });
    await flushFocus();
    expect(document.activeElement).toBe(notes);
    expect(notes.value).toBe(
      "Baby noon at 2. Bring the car seat. Call on arrival.",
    );
  });

  it("does not steal focus when the parent renders a new onClose", async () => {
    render(<NotesSheet />);
    const notes = await focusNotes();
    fireEvent.change(notes, { target: { value: "Kept" } });
    await flushFocus();
    notes.focus();

    act(() => {
      bumpParent();
    });
    await flushFocus();

    expect(document.activeElement).toBe(notes);
    expect(notes.value).toBe("Kept");
    expect(screen.getByTestId("epoch")).toHaveTextContent("1");
  });

  it("focuses the preferred target when the sheet opens", async () => {
    render(<NotesSheet preferred />);
    await flushFocus();
    await flushFocus();
    expect(document.activeElement).toBe(
      document.getElementById("preferred-target"),
    );
  });

  it("falls back to the first focusable control when nothing is preferred", async () => {
    render(<NotesSheet />);
    await flushFocus();
    await flushFocus();
    const panel = document.querySelector("[role='dialog']");
    const first = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(document.activeElement).toBe(first);
    expect(first?.getAttribute("aria-label")).toBe("Resize booking panel");
  });

  it("falls back to the header control on a phone-width sheet", async () => {
    stubMatchMedia(false);
    render(<NotesSheet desktop={false} />);
    await flushFocus();
    await flushFocus();
    expect(document.activeElement).toHaveAttribute("aria-label", "Quick actions");
  });

  it("invokes the latest onClose, including pending refusal and later close", async () => {
    render(<NotesSheet />);
    await flushFocus();

    fireEvent.click(screen.getByRole("button", { name: "Mark pending" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("open-state")).toHaveTextContent("open");
    expect(document.querySelector("[role='dialog']")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear pending" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("open-state")).toHaveTextContent("closed");
    expect(document.querySelector("[role='dialog']")).toBeNull();
  });

  it("restarts initial focus after close and reopen", async () => {
    render(<NotesSheet preferred />);
    const notes = await focusNotes();
    fireEvent.change(notes, { target: { value: "Session" } });
    await flushFocus();
    expect(document.activeElement).toBe(notes);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("open-state")).toHaveTextContent("closed");

    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    await flushFocus();
    await flushFocus();
    expect(document.activeElement).toBe(
      document.getElementById("preferred-target"),
    );
    expect(notesField().value).toBe("Session");
  });

  it("contains Tab and Shift+Tab inside the panel", async () => {
    stubMatchMedia(false);
    render(<NotesSheet desktop={false} />);
    await flushFocus();
    const panel = document.querySelector("[role='dialog']") as HTMLElement;
    const focusable = [
      ...panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    expect(first).toHaveAttribute("aria-label", "Quick actions");
    expect(last).toHaveTextContent("Confirm appointment");

    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("locks body scroll while open and restores it on close", async () => {
    render(<NotesSheet />);
    await flushFocus();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("open-state")).toHaveTextContent("closed");
    expect(document.body.style.overflow).toBe("");
  });

  it("does not submit the booking form while notes are typed", async () => {
    render(<NotesSheet />);
    const notes = await focusNotes();
    fireEvent.change(notes, { target: { value: "Do not submit" } });
    fireEvent.keyDown(notes, { key: "Enter" });
    await flushFocus();
    expect(screen.getByTestId("submits")).toHaveTextContent("0");
    expect(notes.value).toBe("Do not submit");
    expect(document.activeElement).toBe(notes);
  });

  it("keeps an account-style sheet closable without stealing its controls", async () => {
    function AccountSheet() {
      const [open, setOpen] = useState(true);
      const [choice, setChoice] = useState("All locations");
      return (
        <>
          <output data-testid="choice">{choice}</output>
          <output data-testid="account-open">{open ? "open" : "closed"}</output>
          <Sheet
            open={open}
            onClose={() => setOpen(false)}
            title="Workspace location"
            description="Choose which location you’re viewing."
          >
            <button type="button" onClick={() => setChoice("Baby World")}>
              Baby World
            </button>
          </Sheet>
        </>
      );
    }

    render(<AccountSheet />);
    await flushFocus();
    const choice = screen.getByRole("button", { name: "Baby World" });
    choice.focus();
    fireEvent.click(choice);
    await flushFocus();
    expect(screen.getByTestId("choice")).toHaveTextContent("Baby World");
    expect(document.activeElement).toBe(choice);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("account-open")).toHaveTextContent("closed");
  });
});
