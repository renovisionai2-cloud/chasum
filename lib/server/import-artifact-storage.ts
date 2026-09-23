import "server-only";

import { createHash } from "node:crypto";
import type { createServiceClient } from "@/lib/supabase/service";

export const IMPORT_ARTIFACT_BUCKET = "import-artifacts";
export const IMPORT_ARTIFACT_MAX_BYTES = 10 * 1024 * 1024;
export const RAW_RETENTION_HOURS = 24;
export const REVIEWED_RETENTION_HOURS = 72;
export const TERMINAL_RETENTION_HOURS = 1;
export const SIGNED_UPLOAD_TTL_SECONDS = 2 * 60 * 60;
export const CLEANUP_BATCH_SIZE = 25;
export const ARTIFACT_REQUEST_TIMEOUT_MS = 10_000;
export const RAW_MEDIA_TYPES = ["text/csv", "text/plain", "application/csv", "application/vnd.ms-excel", "application/octet-stream"] as const;

type Service = ReturnType<typeof createServiceClient>;
export class ImportArtifactError extends Error {
  constructor(public readonly code: "OWNER_REQUIRED" | "INVALID_INPUT" | "UNAVAILABLE" = "UNAVAILABLE") {
    super({
      OWNER_REQUIRED: "Only the primary business owner can access import artifacts.",
      INVALID_INPUT: "The import artifact is invalid or exceeds the 10 MiB limit.",
      UNAVAILABLE: "The import artifact is unavailable or expired. Do not rebuild a reviewed plan to resume this run.",
    }[code]);
  }
}

/** Every boundary suppresses upstream messages, request URLs and payload details. */
export async function artifactBoundary<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); }
  catch (error) {
    if (error instanceof ImportArtifactError) throw error;
    throw new ImportArtifactError();
  }
}

export async function artifactRpc(service: Service, name: string, args: Record<string, unknown>) {
  const { data, error } = await service.rpc(name, args);
  if (error) throw new ImportArtifactError(error.message === "C1_OWNER_REQUIRED" ? "OWNER_REQUIRED" : "UNAVAILABLE");
  return data;
}

export const artifactDigest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export function checkArtifactBytes(bytes: Uint8Array): void {
  if (bytes.byteLength < 1 || bytes.byteLength > IMPORT_ARTIFACT_MAX_BYTES || bytes.includes(0))
    throw new ImportArtifactError("INVALID_INPUT");
  try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new ImportArtifactError("INVALID_INPUT"); }
}

/** Fetch actual private bytes; metadata is only an early size/media sanity gate.
 * Bucket's independent 10 MiB limit bounds the provider response as well.
 */
export async function downloadArtifact(service: Service, key: string, reviewed: boolean) {
  const bucket = service.storage.from(IMPORT_ARTIFACT_BUCKET);
  const info = await bucket.info(key);
  if (info.error || !info.data) throw new ImportArtifactError();
  if (typeof info.data.size !== "number" || !Number.isSafeInteger(info.data.size) || info.data.size < 1 || info.data.size > IMPORT_ARTIFACT_MAX_BYTES)
    throw new ImportArtifactError("INVALID_INPUT");
  const media = info.data.contentType?.split(";", 1)[0].trim().toLowerCase();
  if (!media || !(reviewed ? media === "application/json" : RAW_MEDIA_TYPES.includes(media as typeof RAW_MEDIA_TYPES[number])))
    throw new ImportArtifactError("INVALID_INPUT");
  const { data, error } = await bucket.download(key);
  if (error || !data) throw new ImportArtifactError();
  if (data.size < 1 || data.size > IMPORT_ARTIFACT_MAX_BYTES) throw new ImportArtifactError("INVALID_INPUT");
  const bytes = Buffer.from(await data.arrayBuffer());
  checkArtifactBytes(bytes);
  return { bytes, sha256: artifactDigest(bytes), media };
}

/** remove() can return an empty list for an already-absent object. Require an
 * exact-key absence check too; never interpret a generic Storage 400 as absence.
 */
export async function deleteArtifactObject(service: Service, key: string): Promise<boolean> {
  try {
    const bucket = service.storage.from(IMPORT_ARTIFACT_BUCKET);
    const removed = await bucket.remove([key]);
    if (removed.error) return false;
    const info = await bucket.info(key);
    if (info.data) return false;
    const error = info.error as { statusCode?: string; status?: number } | null;
    return error?.statusCode === "NoSuchKey" || error?.statusCode === "ObjectNotFound" || error?.status === 404;
  } catch { return false; }
}
