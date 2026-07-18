"use server";

import { getChaseOperationsSnapshot } from "@/lib/chase/analytics";
import type { ChaseOperationsSnapshot } from "@/lib/chase/types";
import { revalidatePath } from "next/cache";

export async function loadChaseOperationsSnapshot(): Promise<ChaseOperationsSnapshot> {
  return getChaseOperationsSnapshot();
}

export async function refreshChaseOperationsSnapshot(): Promise<ChaseOperationsSnapshot> {
  const snap = await getChaseOperationsSnapshot();
  revalidatePath("/dashboard/workforce/chase");
  revalidatePath("/dashboard/ai-workforce/chase");
  revalidatePath("/dashboard/ai-workforce");
  return snap;
}
