"use client";

import { Button } from "@/components/ui/button";
import {
  CalendarPlus,
  CalendarClock,
  CalendarX2,
  CircleDollarSign,
  Mail,
  MessageSquare,
  Printer,
  History,
  Sparkles,
} from "lucide-react";

export type CustomerQuickActionsProps = {
  hasUpcoming: boolean;
  onBook: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onCollectPayment: () => void;
  onMessage: () => void;
  onEmail: () => void;
  onPrint: () => void;
  onOpenTimeline: () => void;
  onAskSummer: () => void;
  busy?: boolean;
};

const ACTIONS: Array<{
  key: keyof Omit<CustomerQuickActionsProps, "hasUpcoming" | "busy">;
  label: string;
  icon: typeof CalendarPlus;
  needsUpcoming?: boolean;
}> = [
  { key: "onBook", label: "Book", icon: CalendarPlus },
  {
    key: "onReschedule",
    label: "Reschedule",
    icon: CalendarClock,
    needsUpcoming: true,
  },
  {
    key: "onCancel",
    label: "Cancel",
    icon: CalendarX2,
    needsUpcoming: true,
  },
  { key: "onCollectPayment", label: "Collect", icon: CircleDollarSign },
  { key: "onMessage", label: "Message", icon: MessageSquare },
  { key: "onEmail", label: "Email", icon: Mail },
  { key: "onPrint", label: "Print", icon: Printer },
  { key: "onOpenTimeline", label: "Timeline", icon: History },
  { key: "onAskSummer", label: "Ask Summer", icon: Sparkles },
];

export function CustomerQuickActions(props: CustomerQuickActionsProps) {
  return (
    <div
      className="flex flex-wrap gap-1.5 print:hidden"
      role="toolbar"
      aria-label="Customer quick actions"
    >
      {ACTIONS.map(({ key, label, icon: Icon, needsUpcoming }) => {
        const disabled =
          Boolean(props.busy) ||
          (needsUpcoming && !props.hasUpcoming);
        return (
          <Button
            key={key}
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            disabled={disabled}
            onClick={props[key]}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
