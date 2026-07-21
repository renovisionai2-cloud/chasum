"use client";

import { ComposeMessageDialog } from "@/components/communication/compose-message-dialog";
import { CommunicationTimeline } from "@/components/communication/communication-timeline";
import {
  CustomerContactActions,
  type ContactTarget,
} from "@/components/communication/customer-contact-actions";
import { FollowUpRemindersPanel } from "@/components/communication/follow-up-reminders";
import { InternalNotesPanel } from "@/components/communication/internal-notes-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerCommunicationBundle } from "@/lib/communication/types";
import { useState } from "react";

type TabKey =
  | "timeline"
  | "email"
  | "sms"
  | "reminders"
  | "notes"
  | "followups";

const TABS: { key: TabKey; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "email", label: "Email history" },
  { key: "sms", label: "SMS history" },
  { key: "reminders", label: "Reminder history" },
  { key: "notes", label: "Internal notes" },
  { key: "followups", label: "Follow-ups" },
];

export function CommunicationCenter({
  customer,
  mapsAddress,
  bundle,
  smsAllowed = true,
  smsBlockedReason = null,
}: {
  customer: ContactTarget & { notes?: string | null };
  mapsAddress?: string | null;
  bundle: CustomerCommunicationBundle;
  smsAllowed?: boolean;
  smsBlockedReason?: string | null;
}) {
  const [tab, setTab] = useState<TabKey>("timeline");
  const [compose, setCompose] = useState<"sms" | "email" | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Communication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CustomerContactActions
            customer={customer}
            mapsAddress={mapsAddress}
            onComposeSms={() => setCompose("sms")}
            onComposeEmail={() => setCompose("email")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Communication Center</CardTitle>
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === item.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {tab === "timeline" ? (
            <CommunicationTimeline items={bundle.history} />
          ) : null}
          {tab === "email" ? (
            <CommunicationTimeline
              items={bundle.emailHistory}
              emptyTitle="No email history"
              emptyDescription="Outbound emails to this client will appear here."
            />
          ) : null}
          {tab === "sms" ? (
            <CommunicationTimeline
              items={bundle.smsHistory}
              emptyTitle="No SMS history"
              emptyDescription="Texts sent to this client will appear here."
            />
          ) : null}
          {tab === "reminders" ? (
            <CommunicationTimeline
              items={bundle.reminderHistory}
              emptyTitle="No reminder history"
              emptyDescription="Follow-up reminders and reminder events will appear here."
            />
          ) : null}
          {tab === "notes" ? (
            <InternalNotesPanel
              customerId={customer.id}
              notes={bundle.notes}
              profileNotes={customer.notes}
            />
          ) : null}
          {tab === "followups" ? (
            <FollowUpRemindersPanel
              customerId={customer.id}
              followUps={bundle.followUps}
            />
          ) : null}
        </CardContent>
      </Card>

      {compose === "sms" && customer.phone ? (
        <ComposeMessageDialog
          open
          mode="sms"
          onClose={() => setCompose(null)}
          customerId={customer.id}
          recipient={customer.phone}
          customerName={customer.name}
          smsAllowed={smsAllowed}
          smsBlockedReason={smsBlockedReason}
        />
      ) : null}
      {compose === "email" ? (
        <ComposeMessageDialog
          open
          mode="email"
          onClose={() => setCompose(null)}
          customerId={customer.id}
          recipient={customer.email}
          customerName={customer.name}
        />
      ) : null}
    </div>
  );
}
