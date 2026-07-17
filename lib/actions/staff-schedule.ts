"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

export async function getStaffWorkingHours(staffId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_working_hours")
    .select("*")
    .eq("staff_id", staffId)
    .order("day_of_week");

  if (error) throw new Error(error.message);
  return data;
}

export async function getStaffVacations(staffId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_vacations")
    .select("*")
    .eq("staff_id", staffId)
    .order("start_date");

  if (error) throw new Error(error.message);
  return data;
}

async function ensureStaffWorkingHours(staffId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_working_hours")
    .select("id")
    .eq("staff_id", staffId)
    .limit(1);

  if (data && data.length > 0) return;

  const hours = Array.from({ length: 7 }, (_, day) => ({
    staff_id: staffId,
    day_of_week: day,
    is_working: day >= 1 && day <= 5,
    start_time: "09:00:00",
    end_time: "17:00:00",
  }));

  await supabase.from("staff_working_hours").insert(hours);
}

export async function updateStaffWorkingHours(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await getOrCreateBusiness();
  const supabase = await createClient();
  const staffId = formData.get("staff_id") as string;

  await ensureStaffWorkingHours(staffId);

  for (let day = 0; day < 7; day++) {
    const isWorking = formData.get(`day_${day}_working`) === "on";
    const startTime = (formData.get(`day_${day}_start`) as string) || "09:00";
    const endTime = (formData.get(`day_${day}_end`) as string) || "17:00";
    const lunchStart =
      (formData.get(`day_${day}_lunch_start`) as string)?.trim() || null;
    const lunchEnd =
      (formData.get(`day_${day}_lunch_end`) as string)?.trim() || null;
    const overtime = formData.get(`day_${day}_overtime`) === "on";

    const payload: Record<string, unknown> = {
      is_working: isWorking,
      start_time: startTime,
      end_time: endTime,
      lunch_start_time: lunchStart || null,
      lunch_end_time: lunchEnd || null,
      overtime_eligible: overtime,
    };

    let { error } = await supabase
      .from("staff_working_hours")
      .update(payload)
      .eq("staff_id", staffId)
      .eq("day_of_week", day);

    if (error && (error.message.includes("lunch_") || error.message.includes("overtime"))) {
      const retry = await supabase
        .from("staff_working_hours")
        .update({
          is_working: isWorking,
          start_time: startTime,
          end_time: endTime,
        })
        .eq("staff_id", staffId)
        .eq("day_of_week", day);
      error = retry.error;
    }

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${staffId}`);
  return { success: "Working hours updated." };
}

export async function addStaffVacation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await getOrCreateBusiness();
  const supabase = await createClient();

  const staffId = formData.get("staff_id") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const reason = (formData.get("reason") as string) || null;
  const kind = (formData.get("kind") as string) || "vacation";

  if (!staffId || !startDate || !endDate) {
    return { error: "Staff and dates are required." };
  }

  let { error } = await supabase.from("staff_vacations").insert({
    staff_id: staffId,
    start_date: startDate,
    end_date: endDate,
    reason,
    kind,
  });

  if (error && error.message.includes("kind")) {
    const retry = await supabase.from("staff_vacations").insert({
      staff_id: staffId,
      start_date: startDate,
      end_date: endDate,
      reason,
    });
    error = retry.error;
  }

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${staffId}`);
  return { success: "Vacation added." };
}

export async function deleteStaffVacation(id: string): Promise<ActionState> {
  await getOrCreateBusiness();
  const supabase = await createClient();

  const { error } = await supabase
    .from("staff_vacations")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/employees");
  return { success: "Vacation removed." };
}

export async function getPublicStaffVacations(staffId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_vacations")
    .select("*")
    .eq("staff_id", staffId);

  if (error) throw new Error(error.message);
  return data;
}

export async function getPublicStaffWorkingHours(staffId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_working_hours")
    .select("*")
    .eq("staff_id", staffId)
    .order("day_of_week");

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllStaffSchedules(staffIds: string[]) {
  if (staffIds.length === 0) return {};

  const supabase = await createClient();

  const [hoursRes, vacationsRes] = await Promise.all([
    supabase
      .from("staff_working_hours")
      .select("*")
      .in("staff_id", staffIds)
      .order("day_of_week"),
    supabase
      .from("staff_vacations")
      .select("*")
      .in("staff_id", staffIds)
      .order("start_date"),
  ]);

  if (hoursRes.error) throw new Error(hoursRes.error.message);
  if (vacationsRes.error) throw new Error(vacationsRes.error.message);

  const schedules: Record<
    string,
    {
      hours: NonNullable<typeof hoursRes.data>;
      vacations: NonNullable<typeof vacationsRes.data>;
    }
  > = {};

  for (const id of staffIds) {
    schedules[id] = { hours: [], vacations: [] };
  }

  for (const row of hoursRes.data ?? []) {
    schedules[row.staff_id]?.hours.push(row);
  }

  for (const row of vacationsRes.data ?? []) {
    schedules[row.staff_id]?.vacations.push(row);
  }

  return schedules;
}
