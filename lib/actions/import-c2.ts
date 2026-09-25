"use server";

import { z } from "zod";
import { c2SourceSystemSchema } from "@/lib/imports/c2-contract";
import { idEntityTypes } from "@/lib/imports/contracts";
import {
  createImportArtifactUpload,
  createImportSource,
  listImportSources,
  verifyImportArtifactUpload,
} from "@/lib/server/import-artifacts";
import { ImportArtifactError } from "@/lib/server/import-artifact-storage";
import {
  C2ImportError,
  inspectC2Artifact,
  lockC2ReviewedImport,
  previewC2Artifact,
  searchC2Customers,
} from "@/lib/server/import-c2";
import { GovernedImportError } from "@/lib/server/import-writer";

export type C2ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

const sourceInputSchema = z.object({
  sourceSystem: c2SourceSystemSchema,
  displayLabel: z.string().trim().min(1).max(120),
}).strict();

const uploadInputSchema = z.object({
  sourceId: z.uuid(),
  entityType: z.enum(idEntityTypes),
}).strict();
function friendlyError(error: unknown): { error: string; code?: string } {
  if (error instanceof C2ImportError) {
    const messages: Record<C2ImportError["code"], string> = {
      OWNER_REQUIRED: "Only the primary business owner can review an import.",
      INVALID_INPUT: "The import setup is incomplete or invalid.",
      SOURCE_NOT_SUPPORTED: "Choose one of the supported CSV source types.",
      PARSE_FAILED: "The CSV could not be parsed with the selected format. Check the delimiter and file structure.",
      REVIEW_AGAIN: "Business data or the reviewed import changed. Review the import again before locking it.",
      UNAVAILABLE: "The import review is temporarily unavailable. No operational data was changed.",
    };
    return { error: messages[error.code], code: error.code };
  }
  if (error instanceof ImportArtifactError || error instanceof GovernedImportError) {
    return { error: error.message, code: error.code };
  }
  if (error instanceof z.ZodError) {
    return { error: "The import setup is incomplete or invalid.", code: "INVALID_INPUT" };
  }
  return {
    error: "The import review could not continue. No operational data was changed.",
    code: "UNAVAILABLE",
  };
}

async function boundary<T>(work: () => Promise<T>): Promise<C2ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    return { ok: false, ...friendlyError(error) };
  }
}
export async function createC2ImportSourceAction(input: unknown) {
  return boundary(async () => {
    const value = sourceInputSchema.parse(input);
    return createImportSource(value);
  });
}

export async function createC2ImportUploadAction(input: unknown) {
  return boundary(async () => {
    const value = uploadInputSchema.parse(input);
    const source = (await listImportSources()).find((item) => item.id === value.sourceId);
    if (!source || !c2SourceSystemSchema.safeParse(source.sourceSystem).success) {
      throw new C2ImportError("SOURCE_NOT_SUPPORTED");
    }
    return createImportArtifactUpload(value);
  });
}

export async function verifyC2ImportUploadAction(artifactId: unknown) {
  return boundary(() => verifyImportArtifactUpload(z.uuid().parse(artifactId)));
}

export async function inspectC2ImportAction(input: {
  artifactId: unknown;
  delimiter?: unknown;
}) {
  return boundary(() => inspectC2Artifact(input.artifactId, input.delimiter));
}

export async function previewC2ImportAction(input: {
  artifactId: string;
  adapter: unknown;
  mapping: unknown;
}) {
  return boundary(() => previewC2Artifact(input));
}
export async function searchC2CustomersAction(query: unknown) {
  return boundary(() => searchC2Customers(query));
}

export async function lockC2ImportReviewAction(input: {
  artifactId: string;
  adapter: unknown;
  mapping: unknown;
  displayedPreviewHash: string;
  displayedSnapshotHash: string;
}) {
  return boundary(() => lockC2ReviewedImport(input));
}
