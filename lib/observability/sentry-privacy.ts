/** Outbound error events are rebuilt, never redacted by spreading SDK input. */
import type { Event, EventHint, Integration, StackFrame } from "@sentry/core";
import { sanitizeTelemetryContext, type TelemetryContext } from "./context";
import { isValidSupportReference } from "./correlation";

const SYMBOL = /^[A-Za-z_][A-Za-z0-9_.:-]{0,119}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function diagnostics(input: Record<string, unknown> | undefined): TelemetryContext {
  const output: TelemetryContext = {};
  for (const [key, value] of Object.entries(sanitizeTelemetryContext(input) ?? {})) {
    if (typeof value !== "string") {
      output[key] = value;
    } else if (key === "referenceId" || key === "correlationId") {
      if (isValidSupportReference(value)) output[key] = value;
    } else if (key.endsWith("Id")) {
      if (UUID.test(value)) output[key] = value;
    } else if (key === "route") {
      // Only Chasum's route template context, never SDK request URLs. Dynamic
      // request paths may contain names/tokens even without a query string.
      const route = value.split(/[?#]/, 1)[0];
      if (/^\/(?:[a-zA-Z0-9_()[\]./-])*$/.test(route)) output[key] = route;
    } else if (SYMBOL.test(value)) {
      output[key] = value;
    }
  }
  return output;
}

function safeFrame(frame: StackFrame): StackFrame {
  const output: StackFrame = {};
  // Retain compiled application source locations, without URL authority,
  // developer home directories, query/fragment, source text, or locals.
  const file = frame.filename?.split(/[?#]/, 1)[0];
  const source = file?.match(/(?:\/_next\/static\/|\/\.next\/)([A-Za-z0-9_./[\]()-]+\.(?:js|mjs|cjs))$/);
  if (source) output.filename = source[0];
  if (Number.isSafeInteger(frame.lineno) && frame.lineno! >= 0) output.lineno = frame.lineno;
  if (Number.isSafeInteger(frame.colno) && frame.colno! >= 0) output.colno = frame.colno;
  if (typeof frame.in_app === "boolean") output.in_app = frame.in_app;
  return output;
}

export function sanitizeSentryEvent(event: Event): Event {
  const extra = diagnostics(event.extra);
  const tags = diagnostics(event.tags);
  // Prefer the application context over ambient SDK tags.
  if (typeof extra.domain === "string") tags.domain = extra.domain;
  if (typeof extra.referenceId === "string") tags.referenceId = extra.referenceId;
  const output: Event = { extra, tags };
  if (event.event_id && /^[a-f0-9]{32}$/i.test(event.event_id)) output.event_id = event.event_id;
  if (Number.isFinite(event.timestamp)) output.timestamp = event.timestamp;
  if (["fatal", "error", "warning", "info", "debug", "log"].includes(event.level ?? "")) output.level = event.level;
  if (["production", "preview", "development", "test"].includes(event.environment ?? "")) output.environment = event.environment;
  if (event.release && /^[a-f0-9]{40}$/i.test(event.release)) output.release = event.release;
  output.platform = "javascript";
  if (event.exception?.values?.length) {
    output.exception = { values: event.exception.values.slice(0, 5).map((exception) => ({
      type: /^(?:[A-Za-z]{1,40}Error|Error|DOMException)$/.test(exception.type ?? "") ? exception.type : "Error",
      value: "Exception details withheld by Chasum privacy policy",
      ...(exception.stacktrace?.frames ? { stacktrace: {
        frames: exception.stacktrace.frames.slice(-50).map(safeFrame),
      } } : {}),
    })) };
  } else {
    output.message = "Chasum diagnostic event";
  }
  return output;
}

/** Runs immediately before envelope creation, including SDK-internal events
 * which Sentry 10.66.0 intentionally routes around beforeSend. */
export const sentryPrivacyIntegration: Integration = {
  name: "ChasumOutboundPrivacy",
  setup(client) {
    client.on("beforeSendEvent", (event: Event, hint?: EventHint) => {
      const safe = sanitizeSentryEvent(event);
      for (const key of Object.keys(event)) delete (event as Record<string, unknown>)[key];
      Object.assign(event, safe);
      if (hint) hint.attachments = [];
    });
  },
};
