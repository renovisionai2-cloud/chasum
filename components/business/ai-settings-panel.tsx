"use client";

import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessAiSettings } from "@/lib/actions/business-management";
import { parseAiSettings } from "@/lib/business/settings";
import type { ActionState, Business } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useActionState } from "react";

export function AiSettingsPanel({ business }: { business: Business }) {
  const ai = parseAiSettings(business.ai_settings);
  const [state, action, pending] = useActionState(
    updateBusinessAiSettings,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, undefined, () => refresh());

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Summer — AI Receptionist</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="summer_enabled"
                defaultChecked={ai.summer.enabled}
              />
              Enable Summer
            </label>
            <div className="space-y-2">
              <Label htmlFor="summer_greeting">Greeting</Label>
              <Input
                id="summer_greeting"
                name="summer_greeting"
                defaultValue={ai.summer.greeting}
                placeholder="Hi — thanks for contacting us. How can I help?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summer_tone">Tone</Label>
              <Select
                id="summer_tone"
                name="summer_tone"
                defaultValue={ai.summer.tone}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="warm">Warm</option>
                <option value="concise">Concise</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summer_escalation">Escalation rules</Label>
              <Textarea
                id="summer_escalation"
                name="summer_escalation"
                rows={3}
                defaultValue={ai.summer.escalation}
                placeholder="Escalate billing disputes and medical questions to staff immediately."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summer_business_knowledge">Business knowledge</Label>
              <Textarea
                id="summer_business_knowledge"
                name="summer_business_knowledge"
                rows={5}
                defaultValue={ai.summer.business_knowledge}
                placeholder="Only facts Summer may use. Never invent hours, prices, or policies."
              />
            </div>

            <div className="rounded-[var(--radius-md)] border border-border/80 bg-muted/20 p-4 space-y-3">
              <p className="text-sm font-semibold">Chase — AI Operations Manager</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="chase_enabled"
                  defaultChecked={ai.chase.enabled}
                />
                Enable Chase
              </label>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="chase_daily_summary"
                    defaultChecked={ai.chase.daily_summary}
                  />
                  Daily summary
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="chase_weekly_summary"
                    defaultChecked={ai.chase.weekly_summary}
                  />
                  Weekly summary
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="chase_recommendations"
                    defaultChecked={ai.chase.recommendations}
                  />
                  Recommendations
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="chase_business_analytics"
                    defaultChecked={ai.chase.business_analytics}
                  />
                  Business analytics
                </label>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Configuration only — Summer and Chase never invent business data.
              Enable Summer, then open AI Workforce → Summer to ask real
              questions and take bookings. Chase surfaces ops insights without
              changing your data.
            </p>

            <AlertMessage error={state.error} success={state.success} />
            <FormFooter pending={pending} submitLabel="Save AI settings" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
