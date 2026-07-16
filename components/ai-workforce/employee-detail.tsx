"use client";

import { AiActivityFeed } from "@/components/ai-workforce/activity-feed";
import { AiEmployeeAvatar } from "@/components/ai-workforce/employee-avatar";
import { AiStatusBadge } from "@/components/ai-workforce/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getEmployeeActivity } from "@/lib/ai-workforce/roster";
import type { AiEmployee } from "@/lib/ai-workforce/types";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "metrics", label: "Metrics" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
  { id: "future", label: "Future" },
];

export function AiEmployeeDetail({
  employee,
  liveAvailability,
  liveReceptionist,
}: {
  employee: AiEmployee;
  liveAvailability?: ReactNode;
  liveReceptionist?: ReactNode;
}) {
  const [tab, setTab] = useState("overview");
  const activity = getEmployeeActivity(employee.id);

  return (
    <div className="ds-page">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/ai-workforce" className="mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            aria-label="Back to AI Workforce"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <AiEmployeeAvatar employee={employee} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {employee.name}
                </h1>
                <AiStatusBadge status={employee.status} />
              </div>
              <p className="mt-1 text-muted-foreground">{employee.role}</p>
            </div>
          </div>
          <Link href="/dashboard/ai-workforce/command">
            <Button size="sm">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Ask {employee.name}
            </Button>
          </Link>
        </div>
      </div>

      <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>{employee.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="ds-label mb-3">Primary responsibilities</p>
                <ul className="space-y-2">
                  {employee.responsibilities.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-spark" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <div className="space-y-6 lg:col-span-2">
              {liveAvailability}
              <Card>
                <CardHeader>
                  <CardTitle>Today</CardTitle>
                  <CardDescription>
                    {liveReceptionist
                      ? "Phase 1 receptionist console below"
                      : liveAvailability
                        ? "Live availability above · other metrics stay assistive"
                        : "Placeholder until live automation"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="ds-label">Tasks completed</p>
                    <p className="text-3xl font-semibold tabular-nums">
                      {employee.tasksCompletedToday}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {employee.name} follows Chasum AI principles: remove work,
                    recommend actions, never invent business data, and keep you
                    in control.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          {liveReceptionist}
        </div>
      )}

      {tab === "metrics" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {employee.metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="p-5">
                <p className="ds-label">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {metric.value}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{metric.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>
              Events attributed to {employee.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AiActivityFeed items={activity} compact />
          </CardContent>
        </Card>
      )}

      {tab === "settings" && (
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Autonomy stays off until you enable it. Preview controls only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="autonomy">Autonomy level</Label>
              <Select id="autonomy" defaultValue="assist" disabled>
                <option value="assist">Assist — suggest only</option>
                <option value="automate">Automate — within policy</option>
                <option value="collaborate">Collaborate — handoffs on</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                Live controls ship with activation. Owners remain in control.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Communication tone</Label>
              <Select id="tone" defaultValue="warm" disabled>
                <option value="warm">Warm & professional</option>
                <option value="concise">Concise</option>
                <option value="formal">Formal</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Owner notes for {employee.name}</Label>
              <Textarea
                id="notes"
                placeholder="Policies, FAQs, and preferences this employee should respect…"
                disabled
                rows={4}
              />
            </div>
            <Button disabled>Save settings (coming soon)</Button>
          </CardContent>
        </Card>
      )}

      {tab === "future" && (
        <EmptyState
          icon="spark"
          title="Future capabilities"
          description={`${employee.name} will grow with your business — always through configuration, never by inventing data.`}
        >
          <ul className="mx-auto max-w-md space-y-2 text-left text-sm text-muted-foreground">
            {employee.futureCapabilities.map((cap) => (
              <li key={cap} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {cap}
              </li>
            ))}
          </ul>
        </EmptyState>
      )}
    </div>
  );
}