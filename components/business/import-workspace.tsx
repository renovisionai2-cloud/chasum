"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import {
  createC2ImportSourceAction,
  createC2ImportUploadAction,
  inspectC2ImportAction,
  lockC2ImportReviewAction,
  previewC2ImportAction,
  searchC2CustomersAction,
  verifyC2ImportUploadAction,
} from "@/lib/actions/import-c2";
import {
  buildAttentionCsv,
  C2_MAPPING_VERSION,
  C2_REVIEW_CATEGORIES,
  C2_SOURCE_SYSTEMS,
  type C2ReviewCategory,
} from "@/lib/imports/c2-contract";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { ReasonCode } from "@/lib/imports/contracts";

type EntityType = "location" | "service" | "staff" | "customer" | "appointment";
type TargetType = "location" | "service" | "staff" | "customer";
type TargetOption = { id: string; name: string; email?: string | null; phone?: string | null };
type Source = { id: string; sourceSystem: string; displayLabel: string; createdAt: string };
type Setup = {
  business: { id: string; timezone: string; currency: string };
  sources: Source[];
  targets: {
    location: TargetOption[];
    service: TargetOption[];
    staff: TargetOption[];
  };
};
type Inspection = {
  artifactId: string;
  entityType: EntityType;
  sha256: string;
  sourceSystem: string;
  delimiter: "," | ";" | "\t" | null;
  detection: {
    delimiter: "," | ";" | "\t" | null;
    ambiguous: boolean;
    candidates: Array<{ delimiter: "," | ";" | "\t"; columns: number; consistentRows: number }>;
  };
  headers: Array<{ index: number; header: string }>;
  samples: Array<{ physicalRow: number; values: string[] }>;
  rowCount: number | null;
};
type ReviewRow = {
  sourceRowKey: string;
  physicalRow?: number;
  entityType: string;
  category: C2ReviewCategory;
  status: string;
  reasonCodes: string[];
  sourceLabel?: string;
  sourceDetail?: string;
};
type ReferenceValue = {
  field: string;
  targetEntity: TargetType;
  key: string;
  sample: string;
  resolvedId?: string;
  resolution: "source_ref" | "explicit" | "unresolved";
};
type Preview = {
  previewHash: string;
  snapshotHash: string;
  capacity: { maxLocations: number | null; maxStaff: number | null; activeLocations: number; activeStaff: number };
  counts: Record<C2ReviewCategory, number>;
  reviewRows: ReviewRow[];
  attentionRows: Array<{ physicalRow: number; issue: "Needs review" | "Blocked"; reasons: ReasonCode[]; values: string[] }>;
  headers: string[];
  referenceValues: ReferenceValue[];
  sourceStatuses: string[];
  locationSlugs: string[];
};
type Locked = {
  state: "ready_for_import";
  runId: string;
  reviewedSha256: string;
  reviewedExpiresAt: string;
};

const ENTITY_LABELS: Record<EntityType, string> = {
  location: "Locations",
  service: "Services",
  staff: "Staff",
  customer: "Customers",
  appointment: "Appointments",
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "arrived",
  "waiting",
  "in_progress",
  "cancelled",
  "completed",
  "no_show",
] as const;

const SINGLE_DATE_FORMATS = [
  "ISO_8601",
  "ISO_LOCAL",
  "YYYY-MM-DD HH:mm",
  "DD/MM/YYYY HH:mm",
  "MM/DD/YYYY hh:mm a",
] as const;

const SPLIT_DATE_FORMATS = [
  "YYYY-MM-DD+HH:mm",
  "DD/MM/YYYY+HH:mm",
  "MM/DD/YYYY+hh:mm a",
] as const;

const DIRECT_FIELDS: Record<EntityType, Array<{ key: string; label: string; required?: boolean }>> = {
  location: [
    { key: "name", label: "Location name", required: true },
    { key: "slug", label: "Slug" },
    { key: "timezone", label: "Per-row IANA timezone" },
    { key: "address", label: "Address" },
    { key: "phone", label: "Phone" },
  ],
  service: [{ key: "name", label: "Service name", required: true }],
  staff: [
    { key: "name", label: "Staff name", required: true },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
  ],
  customer: [
    { key: "name", label: "Customer name", required: true },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
  ],
  appointment: [
    { key: "sourceStatus", label: "Source status", required: true },
    { key: "notes", label: "Notes" },
  ],
};

function delimiterLabel(value: "," | ";" | "\t") {
  if (value === ",") return "Comma (,)";
  if (value === ";") return "Semicolon (;)";
  return "Tab";
}

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ImportWorkspace({ initial }: { initial: Setup }) {
  const [sources, setSources] = useState(initial.sources);
  const [sourceId, setSourceId] = useState(initial.sources[0]?.id ?? "");
  const [newSystem, setNewSystem] = useState<(typeof C2_SOURCE_SYSTEMS)[number]["key"]>("other_csv");
  const [newLabel, setNewLabel] = useState("CSV migration");
  const [entityType, setEntityType] = useState<EntityType>("customer");
  const [artifactId, setArtifactId] = useState("");
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [delimiter, setDelimiter] = useState<"," | ";" | "\t">(",");
  const [sourceTimezone, setSourceTimezone] = useState(initial.business.timezone);
  const [sourceCurrency, setSourceCurrency] = useState(initial.business.currency || "CAD");
  const [columns, setColumns] = useState<Record<string, string>>({});
  const [sourceExternalIdColumn, setSourceExternalIdColumn] = useState("");
  const [referenceColumns, setReferenceColumns] = useState<Record<string, string>>({});
  const [listSeparator, setListSeparator] = useState("|");
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours">("minutes");
  const [moneyMode, setMoneyMode] = useState<"major" | "minor">("major");
  const [decimalSeparator, setDecimalSeparator] = useState<"." | ",">(".");
  const [dateMode, setDateMode] = useState<"single" | "split">("single");
  const [singleDateFormat, setSingleDateFormat] = useState<(typeof SINGLE_DATE_FORMATS)[number]>("ISO_8601");
  const [splitDateFormat, setSplitDateFormat] = useState<(typeof SPLIT_DATE_FORMATS)[number]>("YYYY-MM-DD+HH:mm");
  const [financialMode, setFinancialMode] = useState<"NONE" | "UNRECONCILED" | "EXACT">("NONE");
  const [financialColumns, setFinancialColumns] = useState<Record<string, string>>({});
  const [statusMapping, setStatusMapping] = useState<Record<string, string>>({});
  const [explicitRefs, setExplicitRefs] = useState<Record<string, Record<string, string>>>({});
  const [rowLinks, setRowLinks] = useState<Record<string, string>>({});
  const [customerQueries, setCustomerQueries] = useState<Record<string, string>>({});
  const [customerResults, setCustomerResults] = useState<Record<string, TargetOption[]>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewDirty, setPreviewDirty] = useState(false);
  const [category, setCategory] = useState<C2ReviewCategory | "All">("All");
  const [page, setPage] = useState(0);
  const [locked, setLocked] = useState<Locked | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);

  const frozen = Boolean(locked);
  const selectedSource = sources.find((source) => source.id === sourceId);

  const filteredRows = useMemo(() => {
    if (!preview) return [];
    return category === "All" ? preview.reviewRows : preview.reviewRows.filter((row) => row.category === category);
  }, [category, preview]);
  const pageRows = filteredRows.slice(page * 25, page * 25 + 25);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / 25));
  const previewSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preview) previewSummaryRef.current?.focus();
  }, [preview]);

  function resetAfterUpload() {
    setInspection(null);
    setArtifactId("");
    setColumns({});
    setReferenceColumns({});
    setSourceExternalIdColumn("");
    setStatusMapping({});
    setExplicitRefs({});
    setRowLinks({});
    setPreview(null);
    setPreviewDirty(false);
    setLocked(null);
    setMessage(null);
  }

  function columnRef(value: string) {
    if (!inspection || value === "") return undefined;
    const index = Number(value);
    const found = inspection.headers.find((header) => header.index === index);
    return found ? { index: found.index, header: found.header } : undefined;
  }

  function requiredColumn(key: string, label: string) {
    const ref = columnRef(columns[key] ?? "");
    if (!ref) throw new Error("Map " + label + " before previewing.");
    return ref;
  }

  function direct(ref: ReturnType<typeof columnRef>) {
    return ref ? { kind: "column", column: ref } : undefined;
  }

  function moneyTransform(value: string, allowStaticZero = false) {
    if (allowStaticZero && value === "static-zero") return { kind: "static", value: "0" };
    const ref = columnRef(value);
    if (!ref) return undefined;
    return moneyMode === "minor"
      ? { kind: "moneyMinor", column: ref }
      : { kind: "moneyMajor", column: ref, decimalSeparator };
  }

  function buildAdapter() {
    if (!inspection) throw new Error("Upload and inspect a CSV first.");
    if (!sourceTimezone) throw new Error("Choose the source timezone.");
    if (!/^[A-Za-z]{3}$/.test(sourceCurrency)) throw new Error("Source currency must be a three-letter currency code.");

    const fields: Record<string, unknown> = {};
    for (const field of DIRECT_FIELDS[entityType]) {
      const ref = field.required ? requiredColumn(field.key, field.label) : columnRef(columns[field.key] ?? "");
      const transform = direct(ref);
      if (transform) fields[field.key] = transform;
    }

    if (entityType === "service") {
      fields.durationMinutes = {
        kind: "duration",
        column: requiredColumn("durationMinutes", "Duration"),
        unit: durationUnit,
      };
      const price = moneyTransform(columns.priceCents ?? "");
      if (!price) throw new Error("Map Service price before previewing.");
      fields.priceCents = price;
      fields.currency = { kind: "static", value: sourceCurrency.toUpperCase() };
    }

    if (entityType === "appointment") {
      if (dateMode === "single") {
        fields.start = { kind: "datetime", column: requiredColumn("start", "Start"), format: singleDateFormat };
        fields.end = { kind: "datetime", column: requiredColumn("end", "End"), format: singleDateFormat };
      } else {
        fields.start = {
          kind: "dateTimeColumns",
          dateColumn: requiredColumn("startDate", "Start date"),
          timeColumn: requiredColumn("startTime", "Start time"),
          format: splitDateFormat,
        };
        fields.end = {
          kind: "dateTimeColumns",
          dateColumn: requiredColumn("endDate", "End date"),
          timeColumn: requiredColumn("endTime", "End time"),
          format: splitDateFormat,
        };
      }
      fields.timezone = { kind: "static", value: sourceTimezone };
    }

    const references: Record<string, unknown> = {};
    const specs: Array<{ field: string; targetEntity: TargetType; list?: boolean }> =
      entityType === "service"
        ? [{ field: "locations", targetEntity: "location", list: true }]
        : entityType === "staff"
          ? [
              { field: "locations", targetEntity: "location", list: true },
              { field: "services", targetEntity: "service", list: true },
            ]
          : entityType === "appointment"
            ? [
                { field: "location", targetEntity: "location" },
                { field: "service", targetEntity: "service" },
                { field: "staff", targetEntity: "staff" },
                { field: "customer", targetEntity: "customer" },
              ]
            : [];
    for (const spec of specs) {
      const ref = columnRef(referenceColumns[spec.field] ?? "");
      if (!ref) continue;
      references[spec.field] = {
        column: ref,
        targetEntity: spec.targetEntity,
        mode: "sourceExternalId",
        explicit: explicitRefs[spec.field] ?? {},
        ...(spec.list ? { separator: listSeparator } : {}),
      };
    }

    const sourceExternalIdRef = columnRef(sourceExternalIdColumn);
    let appointmentFinancials: unknown = undefined;
    if (entityType === "appointment") {
      if (financialMode === "EXACT") {
        const keys = [
          "priceCents",
          "taxCents",
          "discountCents",
          "depositCents",
          "amountPaidCents",
          "amountRefundedCents",
        ];
        const money: Record<string, unknown> = {};
        for (const key of keys) {
          const transform = moneyTransform(financialColumns[key] ?? "static-zero", true);
          if (!transform) throw new Error("Map all exact financial fields.");
          money[key] = transform;
        }
        appointmentFinancials = {
          kind: "EXACT",
          currency: { kind: "static", value: sourceCurrency.toUpperCase() },
          ...money,
        };
      } else {
        appointmentFinancials = { kind: financialMode };
      }
    }

    return {
      version: "c2-csv-v1",
      entityType,
      delimiter,
      sourceTimezone,
      sourceCurrency: sourceCurrency.toUpperCase(),
      ...(sourceExternalIdRef ? { sourceExternalIdColumn: sourceExternalIdRef } : {}),
      fields,
      references,
      ...(appointmentFinancials ? { appointmentFinancials } : {}),
    };
  }

  function buildMapping() {
    const allowed = new Set(["location", "service", "staff", "customer", "appointment"]);
    const links = Object.entries(rowLinks).flatMap(([sourceRowKey, existingId]) => {
      const entityType = sourceRowKey.split(":", 1)[0];
      if (!existingId || !allowed.has(entityType)) return [];
      return [{ entityType, sourceRowKey, existingId }];
    });
    return {
      version: C2_MAPPING_VERSION,
      statusMapping,
      links,
    };
  }

  async function createSource() {
    setBusy("source");
    setMessage(null);
    const result = await createC2ImportSourceAction({ sourceSystem: newSystem, displayLabel: newLabel });
    setBusy("");
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setSources((current) => [...current, result.data]);
    setSourceId(result.data.id);
    setMessage({ tone: "success", text: "Import source created. It can be reused for future migration files." });
  }
  async function uploadCsv(file: File) {
    if (!sourceId) return setMessage({ tone: "error", text: "Choose or create an import source first." });
    if (!file.name.toLowerCase().endsWith(".csv")) return setMessage({ tone: "error", text: "C2 accepts CSV files only." });
    if (file.size < 1 || file.size > 10 * 1024 * 1024) return setMessage({ tone: "error", text: "CSV must be between 1 byte and 10 MiB." });

    setBusy("upload");
    setMessage(null);
    const intent = await createC2ImportUploadAction({ sourceId, entityType });
    if (!intent.ok) {
      setBusy("");
      return setMessage({ tone: "error", text: intent.error });
    }

    const supabase = createBrowserClient();
    const stored = await supabase.storage
      .from(intent.data.bucket)
      .uploadToSignedUrl(intent.data.path, intent.data.token, file, {
        contentType: file.type || "text/csv",
        cacheControl: "0",
        upsert: false,
      });
    if (stored.error) {
      setBusy("");
      return setMessage({ tone: "error", text: "The private CSV upload did not complete. No operational data was changed." });
    }

    const verified = await verifyC2ImportUploadAction(intent.data.artifactId);
    if (!verified.ok) {
      setBusy("");
      return setMessage({ tone: "error", text: verified.error });
    }
    setArtifactId(intent.data.artifactId);
    const inspected = await inspectC2ImportAction({ artifactId: intent.data.artifactId });
    setBusy("");
    if (!inspected.ok) return setMessage({ tone: "error", text: inspected.error });
    setInspection(inspected.data as Inspection);
    if (inspected.data.delimiter) setDelimiter(inspected.data.delimiter);
    setMessage({
      tone: "success",
      text: "CSV verified privately. Confirm the parsing rules, then map fields and review the result.",
    });
  }

  async function confirmDelimiter(next: "," | ";" | "\t") {
    if (!artifactId) return;
    setBusy("inspect");
    setDelimiter(next);
    const result = await inspectC2ImportAction({ artifactId, delimiter: next });
    setBusy("");
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setInspection(result.data as Inspection);
    setPreview(null);
    setMessage({ tone: "info", text: "Delimiter confirmed. Date, timezone, currency and decimal rules still require explicit choices." });
  }

  async function runPreview() {
    try {
      setBusy("preview");
      setMessage(null);
      const adapter = buildAdapter();
      const result = await previewC2ImportAction({ artifactId, adapter, mapping: buildMapping() });
      setBusy("");
      if (!result.ok) return setMessage({ tone: "error", text: result.error });
      setPreview(result.data as Preview);
      setPreviewDirty(false);
      setPage(0);
      setMessage({ tone: "success", text: "Read-only preview rebuilt from the verified CSV and current Chasum business truth." });
    } catch (error) {
      setBusy("");
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Complete the mapping first." });
    }
  }

  async function searchCustomers(key: string) {
    const query = (customerQueries[key] ?? "").trim();
    if (query.length < 2) return;
    setBusy("customer:" + key);
    const result = await searchC2CustomersAction(query);
    setBusy("");
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setCustomerResults((current) => ({ ...current, [key]: result.data }));
  }

  async function lockReview() {
    if (!preview) return;
    if (previewDirty) {
      return setMessage({ tone: "info", text: "Mappings changed. Rebuild the read-only preview before locking the review." });
    }
    if (preview.counts.Blocked > 0 || preview.counts["Needs review"] > 0) {
      return setMessage({ tone: "error", text: "Resolve blocked and needs-review rows before locking the review." });
    }
    try {
      setBusy("lock");
      setMessage(null);
      const result = await lockC2ImportReviewAction({
        artifactId,
        adapter: buildAdapter(),
        mapping: buildMapping(),
        displayedPreviewHash: preview.previewHash,
        displayedSnapshotHash: preview.snapshotHash,
      });
      setBusy("");
      if (!result.ok) return setMessage({ tone: "error", text: result.error });
      setLocked(result.data as Locked);
      setMessage({
        tone: "success",
        text: "Review locked. This run is ready for a future governed import step; C2 has not imported any operational data.",
      });
    } catch (error) {
      setBusy("");
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "The review could not be locked." });
    }
  }

  function setExplicit(field: string, key: string, targetId: string) {
    setExplicitRefs((current) => ({
      ...current,
      [field]: { ...(current[field] ?? {}), [key]: targetId },
    }));
  }

  function targetOptions(targetEntity: TargetType) {
    if (targetEntity === "customer") return [] as TargetOption[];
    return initial.targets[targetEntity];
  }

  function renderColumnSelect(key: string, label: string, required = false) {
    return (
      <div className="space-y-2" key={key}>
        <Label htmlFor={"map-" + key}>{label}{required ? " *" : ""}</Label>
        <Select
          id={"map-" + key}
          value={columns[key] ?? ""}
          onChange={(event) => { setColumns((current) => ({ ...current, [key]: event.target.value })); setPreview(null); }}
          disabled={frozen}
        >
          <option value="">Not mapped</option>
          {inspection?.headers.map((header) => (
            <option key={header.index} value={String(header.index)}>
              {header.index + 1}. {header.header || "(blank header)"}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  function renderReferenceResolvers() {
    if (!preview) return null;
    const unresolved = preview.referenceValues.filter((value) => value.resolution === "unresolved");
    if (unresolved.length === 0) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resolve relationships</CardTitle>
          <p className="text-sm text-muted-foreground">
            Chasum could not resolve these source references. Match them explicitly; customer search is narrow and only runs when you ask.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {unresolved.slice(0, 100).map((ref) => {
            const resolverKey = ref.field + ":" + ref.key;
            const options = targetOptions(ref.targetEntity);
            return (
              <div key={resolverKey} className="rounded-[var(--radius-md)] border border-border p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{ref.field} → {ref.targetEntity}</p>
                    <p className="text-xs text-muted-foreground">{ref.sample}</p>
                  </div>
                  {explicitRefs[ref.field]?.[ref.key] ? <Badge variant="outline">Mapped</Badge> : <Badge>Needs match</Badge>}
                </div>
                {ref.targetEntity === "customer" ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={customerQueries[resolverKey] ?? ""}
                        onChange={(event) => setCustomerQueries((current) => ({ ...current, [resolverKey]: event.target.value }))}
                        placeholder="Search customer name or exact email"
                        disabled={frozen}
                      />
                      <Button variant="outline" size="sm" onClick={() => searchCustomers(resolverKey)} disabled={frozen || busy === "customer:" + resolverKey}>
                        <Search className="h-4 w-4" /> Search
                      </Button>
                    </div>
                    <Select
                      value={explicitRefs[ref.field]?.[ref.key] ?? ""}
                      onChange={(event) => { setExplicit(ref.field, ref.key, event.target.value); setPreviewDirty(true); }}
                      disabled={frozen}
                    >
                      <option value="">Choose customer</option>
                      {(customerResults[resolverKey] ?? []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}{item.email ? " · " + item.email : ""}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <Select
                    value={explicitRefs[ref.field]?.[ref.key] ?? ""}
                    onChange={(event) => { setExplicit(ref.field, ref.key, event.target.value); setPreviewDirty(true); }}
                    disabled={frozen}
                  >
                    <option value="">Choose existing {ref.targetEntity}</option>
                    {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                )}
              </div>
            );
          })}
          {unresolved.length > 100 ? (
            <Alert variant="warning">More than 100 unresolved references remain. Resolve this file in smaller, safer batches.</Alert>
          ) : null}
          <Button variant="outline" onClick={runPreview} disabled={frozen || busy !== ""}>
            Rebuild preview after relationship mapping
          </Button>
        </CardContent>
      </Card>
    );
  }

  function renderRowLinkResolvers() {
    if (!preview) return null;
    const rows = preview.reviewRows.filter((row) =>
      ["location", "service", "staff", "customer"].includes(row.entityType)
      && row.reasonCodes.some((reason) => reason === "EXISTING_CANDIDATE" || reason === "AMBIGUOUS_MATCH" || reason === "IDENTITY_CONFLICT"),
    );
    if (rows.length === 0) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resolve possible existing records</CardTitle>
          <p className="text-sm text-muted-foreground">
            Chasum never links these records by name alone. Confirm the exact existing record or leave the row for review.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.slice(0, 100).map((row) => {
            const targetEntity = row.entityType as TargetType;
            const key = "row:" + row.sourceRowKey;
            const options = targetOptions(targetEntity);
            return (
              <div key={row.sourceRowKey} className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="text-sm font-medium">{row.sourceLabel ?? row.sourceRowKey}</p>
                {row.sourceDetail ? <p className="text-xs text-muted-foreground">{row.sourceDetail}</p> : null}
                {targetEntity === "customer" ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={customerQueries[key] ?? row.sourceDetail ?? row.sourceLabel ?? ""}
                        onChange={(event) => setCustomerQueries((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder="Search customer"
                        disabled={frozen}
                      />
                      <Button variant="outline" size="sm" onClick={() => searchCustomers(key)} disabled={frozen || busy === "customer:" + key}>
                        <Search className="h-4 w-4" /> Search
                      </Button>
                    </div>
                    <Select
                      value={rowLinks[row.sourceRowKey] ?? ""}
                      onChange={(event) => { setRowLinks((current) => ({ ...current, [row.sourceRowKey]: event.target.value })); setPreviewDirty(true); }}
                      disabled={frozen}
                    >
                      <option value="">Do not link yet</option>
                      {(customerResults[key] ?? []).map((item) => (
                        <option key={item.id} value={item.id}>{item.name}{item.email ? " · " + item.email : ""}</option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <Select
                    className="mt-2"
                    value={rowLinks[row.sourceRowKey] ?? ""}
                    onChange={(event) => { setRowLinks((current) => ({ ...current, [row.sourceRowKey]: event.target.value })); setPreviewDirty(true); }}
                    disabled={frozen}
                  >
                    <option value="">Do not link yet</option>
                    {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                )}
              </div>
            );
          })}
          <Button variant="outline" onClick={runPreview} disabled={frozen || busy !== ""}>
            Rebuild preview after record links
          </Button>
        </CardContent>
      </Card>
    );
  }

  function renderReferenceColumn(field: string, label: string) {
    return (
      <div className="space-y-2" key={field}>
        <Label htmlFor={"reference-" + field}>{label}</Label>
        <Select
          id={"reference-" + field}
          value={referenceColumns[field] ?? ""}
          onChange={(event) => {
            setReferenceColumns((current) => ({ ...current, [field]: event.target.value }));
            setPreview(null);
          }}
          disabled={frozen}
        >
          <option value="">Not mapped</option>
          {inspection?.headers.map((header) => (
            <option key={header.index} value={String(header.index)}>
              {header.index + 1}. {header.header || "(blank header)"}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  function renderFinancialColumn(field: string, label: string) {
    return (
      <div className="space-y-2" key={field}>
        <Label htmlFor={"financial-" + field}>{label}</Label>
        <Select
          id={"financial-" + field}
          value={financialColumns[field] ?? "static-zero"}
          onChange={(event) => {
            setFinancialColumns((current) => ({ ...current, [field]: event.target.value }));
            setPreview(null);
          }}
          disabled={frozen}
        >
          <option value="static-zero">Use 0</option>
          {inspection?.headers.map((header) => (
            <option key={header.index} value={String(header.index)}>
              {header.index + 1}. {header.header || "(blank header)"}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  function downloadAttentionRows() {
    if (!preview || preview.attentionRows.length === 0) return;
    const csv = buildAttentionCsv(preview.headers, preview.attentionRows);
    downloadText("chasum-import-rows-needing-attention.csv", csv);
  }

  return (
    <div className="space-y-6 pb-24">
      <Alert variant="info" title="Safe migration review">
        C2 reads and reviews private CSV data only. It does not create customers,
        appointments, staff, services, or locations. Only the primary business owner
        can use this workspace.
      </Alert>

      {message ? (
        <Alert
          variant={
            message.tone === "error"
              ? "destructive"
              : message.tone === "success"
                ? "success"
                : "info"
          }
        >
          {message.text}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>1. Source and CSV</CardTitle>
          <p className="text-sm text-muted-foreground">
            Reuse a migration source or create one with a canonical source-system key.
            The display label is only for people.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="existing-source">Existing source</Label>
              <Select
                id="existing-source"
                value={sourceId}
                onChange={(event) => {
                  setSourceId(event.target.value);
                  resetAfterUpload();
                }}
                disabled={Boolean(artifactId) || frozen}
              >
                <option value="">Choose source</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.displayLabel} · {source.sourceSystem}
                  </option>
                ))}
              </Select>
              {selectedSource ? (
                <p className="text-xs text-muted-foreground">
                  Using {selectedSource.displayLabel}
                </p>
              ) : null}
            </div>

            <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
              <p className="text-sm font-medium">Create source</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="source-system">Source system</Label>
                  <Select
                    id="source-system"
                    value={newSystem}
                    onChange={(event) => setNewSystem(event.target.value as typeof newSystem)}
                    disabled={Boolean(artifactId) || frozen}
                  >
                    {C2_SOURCE_SYSTEMS.map((source) => (
                      <option key={source.key} value={source.key}>{source.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source-label">Display label</Label>
                  <Input
                    id="source-label"
                    value={newLabel}
                    onChange={(event) => setNewLabel(event.target.value)}
                    maxLength={120}
                    disabled={Boolean(artifactId) || frozen}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={createSource}
                disabled={Boolean(artifactId) || frozen || busy !== "" || !newLabel.trim()}
              >
                Add source
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entity-type">Data in this CSV</Label>
              <Select
                id="entity-type"
                value={entityType}
                onChange={(event) => {
                  setEntityType(event.target.value as EntityType);
                  resetAfterUpload();
                }}
                disabled={Boolean(artifactId) || frozen}
              >
                {(Object.keys(ENTITY_LABELS) as EntityType[]).map((key) => (
                  <option key={key} value={key}>{ENTITY_LABELS[key]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV file</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv,text/plain"
                disabled={!sourceId || Boolean(artifactId) || frozen || busy !== ""}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadCsv(file);
                }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Private artifact · CSV only · maximum 10 MiB · no XLS/XLSX
          </p>

          {artifactId ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Verified private CSV</Badge>
              <span className="break-all font-mono text-xs text-muted-foreground">{artifactId}</span>
              {!frozen ? (
                <Button variant="ghost" onClick={resetAfterUpload}>Start over locally</Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {artifactId ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Parsing rules</CardTitle>
            <p className="text-sm text-muted-foreground">
              Detection is only a suggestion. Confirm regional parsing rules explicitly.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="delimiter">Delimiter</Label>
                <Select
                  id="delimiter"
                  value={delimiter}
                  onChange={(event) => setDelimiter(event.target.value as "," | ";" | "\t")}
                  disabled={frozen || busy !== ""}
                >
                  {([",", ";", "\t"] as const).map((item) => (
                    <option key={item} value={item}>{delimiterLabel(item)}</option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void confirmDelimiter(delimiter)}
                  disabled={frozen || busy !== ""}
                >
                  Apply delimiter
                </Button>
              </div>

              <TimezoneSelect
                label="Source timezone"
                value={sourceTimezone}
                onChange={(value) => {
                  setSourceTimezone(value);
                  setPreview(null);
                }}
                disabled={frozen}
                required
              />

              <div className="space-y-2">
                <Label htmlFor="source-currency">Source currency</Label>
                <Input
                  id="source-currency"
                  value={sourceCurrency}
                  maxLength={3}
                  onChange={(event) => {
                    setSourceCurrency(event.target.value.toUpperCase());
                    setPreview(null);
                  }}
                  disabled={frozen}
                />
                <p className="text-xs text-muted-foreground">
                  Three-letter code; never inferred from geography.
                </p>
              </div>
            </div>

            {inspection?.headers.length ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="external-id">Stable source external ID</Label>
                  <Select
                    id="external-id"
                    value={sourceExternalIdColumn}
                    onChange={(event) => {
                      setSourceExternalIdColumn(event.target.value);
                      setPreview(null);
                    }}
                    disabled={frozen}
                  >
                    <option value="">No stable ID column</option>
                    {inspection.headers.map((header) => (
                      <option key={header.index} value={String(header.index)}>
                        {header.index + 1}. {header.header || "(blank header)"}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {inspection.samples.slice(0, 3).map((row) => (
                    <div key={row.physicalRow} className="rounded-[var(--radius-md)] border border-border p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Row {row.physicalRow}
                      </p>
                      <div className="space-y-1">
                        {row.values.slice(0, 8).map((value, index) => (
                          <p key={index} className="truncate text-xs">
                            <span className="font-medium">
                              {inspection.headers[index]?.header || ("Column " + (index + 1))}:
                            </span>{" "}
                            {value || "—"}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  {inspection.rowCount ?? 0} rows. The authoritative parser runs on the server
                  against the exact verified private artifact.
                </p>
              </>
            ) : (
              <Alert variant="warning">
                Delimiter detection is ambiguous. Choose a delimiter and apply it explicitly.
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : null}

      {inspection?.headers.length ? (
        <Card>
          <CardHeader>
            <CardTitle>3. Map fields</CardTitle>
            <p className="text-sm text-muted-foreground">
              Column index and observed header are both retained so duplicate human headers stay distinct.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {DIRECT_FIELDS[entityType].map((field) =>
                renderColumnSelect(field.key, field.label, field.required),
              )}
            </div>

            {entityType === "service" ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {renderColumnSelect("durationMinutes", "Duration", true)}
                  {renderColumnSelect("priceCents", "Service price", true)}
                  <div className="space-y-2">
                    <Label htmlFor="duration-unit">Duration unit</Label>
                    <Select
                      id="duration-unit"
                      value={durationUnit}
                      onChange={(event) => {
                        setDurationUnit(event.target.value as "minutes" | "hours");
                        setPreview(null);
                      }}
                      disabled={frozen}
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="money-mode-service">Price source units</Label>
                    <Select
                      id="money-mode-service"
                      value={moneyMode}
                      onChange={(event) => {
                        setMoneyMode(event.target.value as "major" | "minor");
                        setPreview(null);
                      }}
                      disabled={frozen}
                    >
                      <option value="major">Major units (for example 19.99)</option>
                      <option value="minor">Minor units (for example 1999)</option>
                    </Select>
                  </div>
                </div>
                {moneyMode === "major" ? (
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="decimal-separator-service">Decimal separator</Label>
                    <Select
                      id="decimal-separator-service"
                      value={decimalSeparator}
                      onChange={(event) => {
                        setDecimalSeparator(event.target.value as "." | ",");
                        setPreview(null);
                      }}
                      disabled={frozen}
                    >
                      <option value=".">Dot (.)</option>
                      <option value=",">Comma (,)</option>
                    </Select>
                  </div>
                ) : null}
                {renderReferenceColumn("locations", "Offered-at locations")}
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="location-list-separator">Multiple-location separator</Label>
                  <Input
                    id="location-list-separator"
                    value={listSeparator}
                    maxLength={4}
                    onChange={(event) => {
                      setListSeparator(event.target.value);
                      setPreview(null);
                    }}
                    disabled={frozen}
                  />
                </div>
              </div>
            ) : null}

            {entityType === "staff" ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {renderReferenceColumn("locations", "Works-at locations")}
                  {renderReferenceColumn("services", "Services")}
                </div>
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="staff-list-separator">Multiple-value separator</Label>
                  <Input
                    id="staff-list-separator"
                    value={listSeparator}
                    maxLength={4}
                    onChange={(event) => {
                      setListSeparator(event.target.value);
                      setPreview(null);
                    }}
                    disabled={frozen}
                  />
                </div>
              </div>
            ) : null}

            {entityType === "appointment" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date-layout">Date/time layout</Label>
                    <Select
                      id="date-layout"
                      value={dateMode}
                      onChange={(event) => {
                        setDateMode(event.target.value as "single" | "split");
                        setPreview(null);
                      }}
                      disabled={frozen}
                    >
                      <option value="single">One date/time column per timestamp</option>
                      <option value="split">Separate date and time columns</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Exact date/time format</Label>
                    {dateMode === "single" ? (
                      <Select
                        id="date-format"
                        value={singleDateFormat}
                        onChange={(event) => {
                          setSingleDateFormat(event.target.value as typeof singleDateFormat);
                          setPreview(null);
                        }}
                        disabled={frozen}
                      >
                        {SINGLE_DATE_FORMATS.map((format) => (
                          <option key={format} value={format}>{format}</option>
                        ))}
                      </Select>
                    ) : (
                      <Select
                        id="date-format"
                        value={splitDateFormat}
                        onChange={(event) => {
                          setSplitDateFormat(event.target.value as typeof splitDateFormat);
                          setPreview(null);
                        }}
                        disabled={frozen}
                      >
                        {SPLIT_DATE_FORMATS.map((format) => (
                          <option key={format} value={format}>{format}</option>
                        ))}
                      </Select>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {dateMode === "single" ? (
                    <>
                      {renderColumnSelect("start", "Start date/time", true)}
                      {renderColumnSelect("end", "End date/time", true)}
                    </>
                  ) : (
                    <>
                      {renderColumnSelect("startDate", "Start date", true)}
                      {renderColumnSelect("startTime", "Start time", true)}
                      {renderColumnSelect("endDate", "End date", true)}
                      {renderColumnSelect("endTime", "End time", true)}
                    </>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {renderReferenceColumn("location", "Location reference")}
                  {renderReferenceColumn("service", "Service reference")}
                  {renderReferenceColumn("staff", "Staff reference")}
                  {renderReferenceColumn("customer", "Customer reference")}
                </div>

                <div className="space-y-4 rounded-[var(--radius-md)] border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">Financial interpretation</p>
                    <p className="text-xs text-muted-foreground">
                      C2 never invents missing money. Choose exact source truth or mark it unreconciled.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="financial-mode">Financial state</Label>
                      <Select
                        id="financial-mode"
                        value={financialMode}
                        onChange={(event) => {
                          setFinancialMode(event.target.value as typeof financialMode);
                          setPreview(null);
                        }}
                        disabled={frozen}
                      >
                        <option value="NONE">No financial data</option>
                        <option value="UNRECONCILED">Financial data not reconciled</option>
                        <option value="EXACT">Exact source money</option>
                      </Select>
                    </div>
                    {financialMode === "EXACT" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="money-mode-appointment">Money source units</Label>
                          <Select
                            id="money-mode-appointment"
                            value={moneyMode}
                            onChange={(event) => {
                              setMoneyMode(event.target.value as "major" | "minor");
                              setPreview(null);
                            }}
                            disabled={frozen}
                          >
                            <option value="major">Major units</option>
                            <option value="minor">Minor units</option>
                          </Select>
                        </div>
                        {moneyMode === "major" ? (
                          <div className="space-y-2">
                            <Label htmlFor="decimal-separator-appointment">Decimal separator</Label>
                            <Select
                              id="decimal-separator-appointment"
                              value={decimalSeparator}
                              onChange={(event) => {
                                setDecimalSeparator(event.target.value as "." | ",");
                                setPreview(null);
                              }}
                              disabled={frozen}
                            >
                              <option value=".">Dot (.)</option>
                              <option value=",">Comma (,)</option>
                            </Select>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>

                  {financialMode === "EXACT" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {renderFinancialColumn("priceCents", "Price")}
                      {renderFinancialColumn("taxCents", "Tax")}
                      {renderFinancialColumn("discountCents", "Discount")}
                      {renderFinancialColumn("depositCents", "Deposit")}
                      {renderFinancialColumn("amountPaidCents", "Amount paid")}
                      {renderFinancialColumn("amountRefundedCents", "Amount refunded")}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={runPreview} disabled={frozen || busy !== ""}>
                <FileSpreadsheet className="h-4 w-4" />
                {preview ? "Rebuild preview" : "Build read-only preview"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Previewing creates no import run and writes no operational business records.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {renderReferenceResolvers()}
      {renderRowLinkResolvers()}

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>4. Review</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review the exact actions Chasum would take later. C2 itself does not commit them.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {previewDirty ? (
              <Alert variant="warning" title="Preview changes pending">
                Finish your mapping choices, then rebuild the read-only preview before locking this review.
                <div className="mt-3">
                  <Button variant="outline" onClick={runPreview} disabled={frozen || busy !== ""}>
                    Rebuild preview
                  </Button>
                </div>
              </Alert>
            ) : null}
            <div
              ref={previewSummaryRef}
              tabIndex={-1}
              aria-live="polite"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
            >
              {C2_REVIEW_CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCategory(item);
                    setPage(0);
                  }}
                  className="min-h-11 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="block text-xs text-muted-foreground">{item}</span>
                  <span className="text-lg font-semibold">{preview.counts[item] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="text-xs text-muted-foreground">Total review rows</p>
                <p className="text-lg font-semibold">{preview.reviewRows.length}</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="text-xs text-muted-foreground">Active locations / limit</p>
                <p className="text-lg font-semibold">
                  {preview.capacity.activeLocations} / {preview.capacity.maxLocations ?? "∞"}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="text-xs text-muted-foreground">Active staff / limit</p>
                <p className="text-lg font-semibold">
                  {preview.capacity.activeStaff} / {preview.capacity.maxStaff ?? "∞"}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="text-xs text-muted-foreground">Rows needing attention</p>
                <p className="text-lg font-semibold">{preview.attentionRows.length}</p>
              </div>
            </div>

            {entityType === "appointment" && preview.sourceStatuses.length > 0 ? (
              <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Appointment status mapping</p>
                  <p className="text-xs text-muted-foreground">
                    Source statuses are trimmed and case-folded. Unknown statuses remain review-blocking until mapped.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {preview.sourceStatuses.map((sourceStatus) => (
                    <div key={sourceStatus} className="space-y-2">
                      <Label htmlFor={"status-" + sourceStatus}>{sourceStatus}</Label>
                      <Select
                        id={"status-" + sourceStatus}
                        value={statusMapping[sourceStatus] ?? ""}
                        onChange={(event) => {
                          setStatusMapping((current) => ({ ...current, [sourceStatus]: event.target.value }));
                          setPreviewDirty(true);
                        }}
                        disabled={frozen}
                      >
                        <option value="">Needs mapping</option>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {preview.locationSlugs.length > 0 ? (
              <Alert variant="info" title="Generated location slugs">
                {preview.locationSlugs.join(", ")}
              </Alert>
            ) : null}

            {preview.attentionRows.length > 0 ? (
              <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Rows needing attention</p>
                  <p className="text-xs text-muted-foreground">
                    Download a client-only helper CSV. Spreadsheet formulas are neutralized before download.
                    This helper is not canonical source truth; leading neutralization markers may need removal
                    before using corrected values in a future source file.
                  </p>
                </div>
                <Button variant="outline" onClick={downloadAttentionRows}>
                  <Download className="h-4 w-4" />
                  Download rows needing attention
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={category === "All" ? "secondary" : "outline"}
                onClick={() => {
                  setCategory("All");
                  setPage(0);
                }}
              >
                All
              </Button>
              {C2_REVIEW_CATEGORIES.map((item) => (
                <Button
                  key={item}
                  variant={category === item ? "secondary" : "outline"}
                  onClick={() => {
                    setCategory(item);
                    setPage(0);
                  }}
                >
                  {item}
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              {pageRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rows in this review category.</p>
              ) : (
                pageRows.map((row) => (
                  <div
                    key={row.entityType + ":" + row.sourceRowKey}
                    className="grid gap-3 rounded-[var(--radius-md)] border border-border p-4 md:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{row.entityType}</Badge>
                        <Badge>{row.category}</Badge>
                        {row.physicalRow ? (
                          <span className="text-xs text-muted-foreground">Row {row.physicalRow}</span>
                        ) : null}
                      </div>
                      <p className="mt-2 truncate text-sm font-medium">
                        {row.sourceLabel ?? row.sourceRowKey}
                      </p>
                      {row.sourceDetail ? (
                        <p className="truncate text-xs text-muted-foreground">{row.sourceDetail}</p>
                      ) : null}
                      {row.reasonCodes.length > 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {row.reasonCodes.join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <span className="self-start text-xs text-muted-foreground">{row.status}</span>
                  </div>
                ))
              )}
            </div>

            {pageCount > 1 ? (
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page + 1} of {pageCount}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                  disabled={page >= pageCount - 1}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {preview && !locked ? (
        <div className="sticky bottom-4 rounded-[var(--radius-lg)] border border-border bg-background/95 p-4 shadow-lg backdrop-blur md:static md:shadow-none">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium">Lock reviewed import</p>
              <p className="text-xs text-muted-foreground">
                Reviewing or locking this import sends no customer or business messages.
                Locking freezes the exact reviewed interpretation for the later governed C3 import step.
              </p>
            </div>
            <Button
              onClick={lockReview}
              disabled={
                busy !== ""
                || previewDirty
                || preview.counts.Blocked > 0
                || preview.counts["Needs review"] > 0
              }
            >
              <LockKeyhole className="h-4 w-4" />
              Lock review
            </Button>
          </div>
        </div>
      ) : null}

      {locked ? (
        <Card>
          <CardHeader>
            <CardTitle>Ready for import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Reviewed plan frozen safely</p>
                <p className="text-xs text-muted-foreground">
                  Run {locked.runId}. C2 has not committed operational data. C3 will own
                  commit, progress, results, cutover, cancellation, and reminder takeover.
                </p>
              </div>
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">
              Reviewed SHA-256: {locked.reviewedSha256}
            </p>
            <p className="text-xs text-muted-foreground">
              Reviewed artifact expires at {locked.reviewedExpiresAt}.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Link
        href="/dashboard/business"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to Business
      </Link>
    </div>
  );
}
