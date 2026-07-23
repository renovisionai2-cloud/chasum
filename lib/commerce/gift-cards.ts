/**
 * Active gift certificates available for a customer at payment time.
 */

import type { GiftCard } from "@/lib/business/types";
import { createClient } from "@/lib/supabase/server";

export async function listActiveGiftCardsForCustomer(
  businessId: string,
  customerId: string,
): Promise<GiftCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "active")
    .gt("balance_cents", 0)
    .or(
      `purchaser_customer_id.eq.${customerId},redeemed_by_customer_id.eq.${customerId}`,
    )
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as GiftCard[]) ?? [];
}
