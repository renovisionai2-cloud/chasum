"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getActiveLocationId } from "@/lib/actions/location";
import { createClient } from "@/lib/supabase/server";

export type StaffDayOverlay = {
  staffId: string;
  isWorking: boolean;
  startMinutes: number | null;
  endMinutes: number | null;
  lunchStartMinutes: number | null;
  lunchEndMinutes: number | null;
  onVacation: boolean;
  hasSplitShifts: boolean;
};

function timeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Schedule overlays for Day View columns — lunch, hours, vacation. */
export async function getStaffDayOverlays(
  dateIso: string,
): Promise<StaffDayOverlay[]> {
  const business = await getOrCreateBusiness();
  const locationId = await getActiveLocationId();
  const supabase = await createClient();
  const date = new Date(dateIso);
  const dow = date.getDay();
  const dateStr = date.toISOString().slice(0, 10);

  const [{ data: staff }, { data: hours }, { data: vacations }, { data: segments }] =
    await Promise.all([
      supabase
        .from("staff")
        .select("id")
        .eq("business_id", business.id)
        .eq("location_id", locationId)
        .eq("is_active", true),
      supabase
        .from("staff_working_hours")
        .select(
          "staff_id, is_working, start_time, end_time, lunch_start_time, lunch_end_time",
        )
        .eq("day_of_week", dow),
      supabase
        .from("staff_vacations")
        .select("staff_id")
        .lte("start_date", dateStr)
        .gte("end_date", dateStr),
      supabase
        .from("staff_hour_segments")
        .select("staff_id, segment_type")
        .eq("day_of_week", dow)
        .eq("segment_type", "work"),
    ]);

  const hoursByStaff = new Map(
    (hours ?? []).map((h) => [h.staff_id as string, h]),
  );
  const vacationSet = new Set(
    (vacations ?? []).map((v) => v.staff_id as string),
  );
  const splitSet = new Set(
    (segments ?? []).map((s) => s.staff_id as string),
  );

  return (staff ?? []).map((member) => {
    const row = hoursByStaff.get(member.id);
    return {
      staffId: member.id,
      isWorking: row ? Boolean(row.is_working) : true,
      startMinutes: timeToMinutes(row?.start_time as string | undefined),
      endMinutes: timeToMinutes(row?.end_time as string | undefined),
      lunchStartMinutes: timeToMinutes(
        row?.lunch_start_time as string | undefined,
      ),
      lunchEndMinutes: timeToMinutes(row?.lunch_end_time as string | undefined),
      onVacation: vacationSet.has(member.id),
      hasSplitShifts: splitSet.has(member.id),
    };
  });
}
