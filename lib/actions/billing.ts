"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  downloadInvoicePayload,
  getBillingProvider,
  getBillingSummary,
} from "@/lib/billing/subscription-service";
import { isPlanKey } from "@/lib/billing/catalog";
import type { ActionState } from "@/lib/types/booking";
import type { BillingInterval, PlanKey } from "@/lib/billing/types";
import { revalidatePath } from "next/cache";

export async function loadBusinessBilling() {
  const business = await getOrCreateBusiness();
  return getBillingSummary(business.id);
}

export async function changeSubscriptionPlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const planKeyRaw = String(formData.get("plan_key") ?? "");
  const intervalRaw = String(formData.get("billing_interval") ?? "monthly");

  if (!isPlanKey(planKeyRaw)) {
    return { error: "Choose a valid plan." };
  }
  if (planKeyRaw === "enterprise") {
    return {
      error: "Enterprise plans require contacting sales (sales@chasum.app).",
    };
  }

  const interval: BillingInterval =
    intervalRaw === "yearly" ? "yearly" : "monthly";

  try {
    await getBillingProvider().changePlan({
      businessId: business.id,
      planKey: planKeyRaw as PlanKey,
      interval,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not change plan.",
    };
  }

  revalidatePath("/dashboard/settings/billing");
  revalidatePath("/dashboard/settings");
  revalidatePath("/owner");
  return { success: "Subscription updated." };
}

export async function cancelSubscriptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const immediately = formData.get("immediately") === "true";

  try {
    await getBillingProvider().cancelSubscription({
      businessId: business.id,
      immediately,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not cancel subscription.",
    };
  }

  revalidatePath("/dashboard/settings/billing");
  revalidatePath("/owner");
  return {
    success: immediately
      ? "Subscription canceled."
      : "Cancellation scheduled at period end.",
  };
}

export async function reactivateSubscriptionAction(): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  try {
    await getBillingProvider().reactivateSubscription({
      businessId: business.id,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not reactivate subscription.",
    };
  }

  revalidatePath("/dashboard/settings/billing");
  return { success: "Subscription reactivated." };
}

export async function getInvoiceDownload(invoiceId: string) {
  const business = await getOrCreateBusiness();
  const summary = await getBillingSummary(business.id);
  const invoice = summary.invoices.find((row) => row.id === invoiceId);
  if (!invoice) {
    return { error: "Invoice not found." as const };
  }
  if (invoice.stripeHostedInvoiceUrl) {
    return { url: invoice.stripeHostedInvoiceUrl };
  }
  const file = await downloadInvoicePayload(invoice);
  return {
    filename: file.filename,
    contentType: file.contentType,
    body: file.body,
  };
}
