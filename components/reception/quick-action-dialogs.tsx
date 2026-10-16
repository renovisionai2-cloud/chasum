"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAvailabilityBlock } from "@/lib/actions/availability";
import { quickCreateCustomer } from "@/lib/actions/customers";
import {
  customerEmailLabel,
  SHARED_PHONE_WARNING,
} from "@/lib/customers/contact-identity";
import type { StaffWithServices } from "@/lib/types/booking";
import { useToast } from "@/providers/toast-provider";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

function NewCustomerForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (customerId: string, name: string) => void;
}) {
  const { toast } = useToast();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [phoneMatches, setPhoneMatches] = useState<
    Array<{ id: string; name: string; email: string | null; phone: string | null }> | null
  >(null);

  useEffect(() => {
    const t = window.setTimeout(() => nameRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  async function submit(createSeparatePerson = false) {
    setPending(true);
    setContactError(null);
    const result = await quickCreateCustomer({
      name,
      email,
      phone: phone || undefined,
      createSeparatePerson,
    });
    setPending(false);
    if (result.emailMatches && result.emailMatches.length > 0) {
      setPhoneMatches(null);
      setContactError(result.error ?? "A customer with this email already exists.");
      return;
    }
    if (result.phoneMatches && result.phoneMatches.length > 0 && !createSeparatePerson) {
      setPhoneMatches(result.phoneMatches);
      return;
    }
    if (result.error || !result.customerId) {
      setPhoneMatches(null);
      setContactError(result.error ?? "Could not create customer.");
      toast(result.error ?? "Could not create customer.", "error");
      return;
    }
    toast(result.success ?? "Customer added.", "success");
    onCreated?.(result.customerId, name.trim());
    onClose();
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="qa_nc_name">Name</Label>
        <Input
          ref={nameRef}
          id="qa_nc_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="qa_nc_email">Email</Label>
        <Input
          id="qa_nc_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-describedby="qa-nc-contact-hint"
          aria-invalid={!!contactError}
        />
        <p id="qa-nc-contact-hint" className="text-xs text-muted-foreground">
          A phone number or email is how you reach this customer. Either one is enough.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="qa_nc_phone">Phone</Label>
        <Input
          id="qa_nc_phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>
      {contactError ? (
        <p id="qa-nc-contact-error" className="text-xs text-destructive" role="alert">
          {contactError}
        </p>
      ) : null}
      {phoneMatches && phoneMatches.length > 0 ? (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-border p-2" role="status">
          <p className="text-xs text-muted-foreground">{SHARED_PHONE_WARNING}</p>
          <ul className="space-y-2">
            {phoneMatches.map((match) => (
              <li key={match.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 truncate text-sm">
                  {match.name}
                  <span className="text-muted-foreground">
                    {" "}
                    · {customerEmailLabel(match.email)}
                    {match.phone ? ` · ${match.phone}` : ""}
                  </span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onCreated?.(match.id, match.name);
                    onClose();
                  }}
                >
                  Use this customer
                </Button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => void submit(true)}
          >
            Create separate person
          </Button>
        </div>
      ) : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending || !name.trim()}
        >
          {pending ? "Saving…" : "Create customer"}
        </Button>
      </div>
    </form>
  );
}

export function NewCustomerDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (customerId: string, name: string) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New customer"
      description="Add a client without leaving Reception."
    >
      {open ? (
        <NewCustomerForm key="nc-form" onClose={onClose} onCreated={onCreated} />
      ) : null}
    </Dialog>
  );
}

function BlockTimeForm({
  staff,
  onClose,
  onSaved,
}: {
  staff: StaffWithServices[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const startRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60_000);
  const [staffId, setStaffId] = useState("");
  const [startLocal, setStartLocal] = useState(
    format(now, "yyyy-MM-dd'T'HH:mm"),
  );
  const [endLocal, setEndLocal] = useState(format(end, "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => startRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  async function submit() {
    setPending(true);
    const fd = new FormData();
    if (staffId) fd.set("staff_id", staffId);
    fd.set("start_time", new Date(startLocal).toISOString());
    fd.set("end_time", new Date(endLocal).toISOString());
    if (notes.trim()) fd.set("notes", notes.trim());
    const result = await createAvailabilityBlock({}, fd);
    setPending(false);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(result.success ?? "Time block added.", "success");
    onSaved();
    onClose();
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="qa_bt_staff">Staff (optional)</Label>
        <Select
          id="qa_bt_staff"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        >
          <option value="">Entire location</option>
          {staff
            .filter((m) => m.is_active)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="qa_bt_start">Start</Label>
        <Input
          ref={startRef}
          id="qa_bt_start"
          type="datetime-local"
          value={startLocal}
          onChange={(e) => setStartLocal(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="qa_bt_end">End</Label>
        <Input
          id="qa_bt_end"
          type="datetime-local"
          value={endLocal}
          onChange={(e) => setEndLocal(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="qa_bt_notes">Notes</Label>
        <Textarea
          id="qa_bt_notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !startLocal || !endLocal}>
          {pending ? "Saving…" : "Block time"}
        </Button>
      </div>
    </form>
  );
}

export function BlockTimeDialog({
  open,
  onClose,
  staff,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  staff: StaffWithServices[];
  onSaved: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Block time"
      description="Mark staff or business time as unavailable."
    >
      {open ? (
        <BlockTimeForm
          key="bt-form"
          staff={staff}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Dialog>
  );
}

function InternalNoteForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState("");
  const dayKey = `chasum-reception-notes:${format(new Date(), "yyyy-MM-dd")}`;

  useEffect(() => {
    const t = window.setTimeout(() => noteRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  function submit() {
    const text = note.trim();
    if (!text) return;
    try {
      const existing = localStorage.getItem(dayKey) ?? "";
      const stamp = format(new Date(), "h:mm a");
      const next = existing
        ? `${existing.trim()}\n[${stamp}] ${text}`
        : `[${stamp}] ${text}`;
      localStorage.setItem(dayKey, next);
      window.dispatchEvent(new Event("chasum-notes-changed"));
      toast("Note added.", "success");
      onClose();
    } catch {
      toast("Could not save note on this device.", "error");
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="qa_note">Note</Label>
        <Textarea
          ref={noteRef}
          id="qa_note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          required
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!note.trim()}>
          Add note
        </Button>
      </div>
    </form>
  );
}

export function InternalNoteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add internal note"
      description="Saved with today’s front-desk notes on this device."
    >
      {open ? <InternalNoteForm key="note-form" onClose={onClose} /> : null}
    </Dialog>
  );
}
