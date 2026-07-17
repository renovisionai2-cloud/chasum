"use client";

import { AlertMessage, FormFooter } from "@/components/ui/form-feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessBrandingSettings } from "@/lib/actions/business-management";
import { parseBookingPageBranding } from "@/lib/business/settings";
import type { ActionState, Business } from "@/lib/types/booking";
import { useFormAction, useRefresh } from "@/hooks/use-form-action";
import { useActionState } from "react";

export function BrandingSettingsPanel({ business }: { business: Business }) {
  const branding = parseBookingPageBranding(business.booking_page_branding);
  const [state, action, pending] = useActionState(
    updateBusinessBrandingSettings,
    {} as ActionState,
  );
  const refresh = useRefresh();
  useFormAction(state, undefined, () => refresh());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <ImageUploadField
              id="logo_url"
              name="logo_url"
              label="Logo"
              folder="logo"
              defaultValue={business.logo_url}
            />
            <ImageUploadField
              id="favicon_url"
              name="favicon_url"
              label="Favicon"
              folder="favicon"
              defaultValue={business.favicon_url}
            />
            <ImageUploadField
              id="cover_url"
              name="cover_url"
              label="Cover / booking hero"
              folder="cover"
              defaultValue={business.cover_url}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand_color">Brand color</Label>
              <Input
                id="brand_color"
                name="brand_color"
                type="color"
                defaultValue={business.brand_color ?? "#2563EB"}
                className="h-10 w-full p-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent color</Label>
              <Input
                id="accent_color"
                name="accent_color"
                type="color"
                defaultValue={business.accent_color ?? "#7C3AED"}
                className="h-10 w-full p-1"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email_signature">Email signature</Label>
              <Textarea
                id="email_signature"
                name="email_signature"
                rows={3}
                defaultValue={business.email_signature ?? ""}
                placeholder="Shown on outbound business emails."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="booking_headline">Booking page headline</Label>
              <Input
                id="booking_headline"
                name="booking_headline"
                defaultValue={branding.headline ?? ""}
                placeholder="Book with us"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_button_label">Primary button label</Label>
              <Input
                id="primary_button_label"
                name="primary_button_label"
                defaultValue={branding.primary_button_label ?? "Book now"}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="show_logo"
                defaultChecked={branding.show_logo !== false}
              />
              Show logo on booking page
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="show_cover"
                defaultChecked={branding.show_cover !== false}
              />
              Show cover on booking page
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            These settings override defaults on the public booking page. The
            Chasum app shell keeps platform branding.
          </p>

          <AlertMessage error={state.error} success={state.success} />
          <FormFooter pending={pending} submitLabel="Save branding" />
        </form>
      </CardContent>
    </Card>
  );
}
