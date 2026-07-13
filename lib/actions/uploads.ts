"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "business-assets";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export async function uploadBusinessAsset(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const business = await getOrCreateBusiness();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "File must be 5 MB or smaller." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Upload a JPG, PNG, WebP, GIF, or PDF." };
  }

  const folder = (formData.get("folder") as string) || "assets";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${business.id}/${folder}/${Date.now()}-${safeName}`;

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
