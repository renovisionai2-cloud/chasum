/**
 * Canonical IANA timezone catalog for business / location settings.
 * Labels are human-readable; stored values are always IANA ids.
 */

export type TimezoneOption = {
  value: string;
  label: string;
  /** Search keywords (city, region, offset aliases) */
  keywords?: string;
};

/** Curated global list — searchable; includes Canada and major regions. */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // Canada
  {
    value: "America/Toronto",
    label: "Toronto — Eastern Time",
    keywords: "canada ontario montreal ottawa quebec eastern et edt est",
  },
  {
    value: "America/Vancouver",
    label: "Vancouver — Pacific Time",
    keywords: "canada british columbia bc pacific pt pdt pst",
  },
  {
    value: "America/Edmonton",
    label: "Edmonton — Mountain Time",
    keywords: "canada alberta calgary mountain mt mdt mst",
  },
  {
    value: "America/Winnipeg",
    label: "Winnipeg — Central Time",
    keywords: "canada manitoba central ct cdt cst",
  },
  {
    value: "America/Halifax",
    label: "Halifax — Atlantic Time",
    keywords: "canada nova scotia new brunswick atlantic at adt ast",
  },
  {
    value: "America/St_Johns",
    label: "St. John’s — Newfoundland Time",
    keywords: "canada newfoundland labrador nt ndt nst st johns",
  },
  {
    value: "America/Whitehorse",
    label: "Whitehorse — Yukon Time",
    keywords: "canada yukon",
  },
  {
    value: "America/Yellowknife",
    label: "Yellowknife — Mountain Time",
    keywords: "canada northwest territories",
  },
  {
    value: "America/Iqaluit",
    label: "Iqaluit — Eastern Time",
    keywords: "canada nunavut",
  },
  {
    value: "America/Regina",
    label: "Regina — Central Time (no DST)",
    keywords: "canada saskatchewan",
  },
  // United States
  {
    value: "America/New_York",
    label: "New York — Eastern Time",
    keywords: "usa us east coast miami boston washington",
  },
  {
    value: "America/Chicago",
    label: "Chicago — Central Time",
    keywords: "usa us midwest",
  },
  {
    value: "America/Denver",
    label: "Denver — Mountain Time",
    keywords: "usa us colorado",
  },
  {
    value: "America/Los_Angeles",
    label: "Los Angeles — Pacific Time",
    keywords: "usa us california seattle portland",
  },
  {
    value: "America/Phoenix",
    label: "Phoenix — Mountain Time (no DST)",
    keywords: "usa arizona",
  },
  {
    value: "America/Anchorage",
    label: "Anchorage — Alaska Time",
    keywords: "usa alaska",
  },
  {
    value: "Pacific/Honolulu",
    label: "Honolulu — Hawaii Time",
    keywords: "usa hawaii",
  },
  // Americas
  {
    value: "America/Mexico_City",
    label: "Mexico City — Central Time",
    keywords: "mexico",
  },
  {
    value: "America/Sao_Paulo",
    label: "São Paulo — Brasília Time",
    keywords: "brazil",
  },
  {
    value: "America/Argentina/Buenos_Aires",
    label: "Buenos Aires",
    keywords: "argentina",
  },
  {
    value: "America/Bogota",
    label: "Bogotá — Colombia Time",
    keywords: "colombia",
  },
  {
    value: "America/Lima",
    label: "Lima — Peru Time",
    keywords: "peru",
  },
  {
    value: "America/Jamaica",
    label: "Jamaica — Eastern Time",
    keywords: "caribbean kingston",
  },
  {
    value: "America/Puerto_Rico",
    label: "Puerto Rico — Atlantic Time",
    keywords: "caribbean san juan",
  },
  // Europe / Africa
  {
    value: "Europe/London",
    label: "London — UK Time",
    keywords: "britain england gmt bst uk",
  },
  {
    value: "Europe/Dublin",
    label: "Dublin — Irish Time",
    keywords: "ireland",
  },
  {
    value: "Europe/Paris",
    label: "Paris — Central European Time",
    keywords: "france cet cest",
  },
  {
    value: "Europe/Berlin",
    label: "Berlin — Central European Time",
    keywords: "germany",
  },
  {
    value: "Europe/Amsterdam",
    label: "Amsterdam — Central European Time",
    keywords: "netherlands",
  },
  {
    value: "Europe/Madrid",
    label: "Madrid — Central European Time",
    keywords: "spain",
  },
  {
    value: "Europe/Rome",
    label: "Rome — Central European Time",
    keywords: "italy",
  },
  {
    value: "Europe/Zurich",
    label: "Zurich — Central European Time",
    keywords: "switzerland",
  },
  {
    value: "Europe/Stockholm",
    label: "Stockholm — Central European Time",
    keywords: "sweden",
  },
  {
    value: "Europe/Athens",
    label: "Athens — Eastern European Time",
    keywords: "greece",
  },
  {
    value: "Europe/Istanbul",
    label: "Istanbul — Turkey Time",
    keywords: "turkey",
  },
  {
    value: "Europe/Moscow",
    label: "Moscow — Moscow Time",
    keywords: "russia",
  },
  {
    value: "Africa/Johannesburg",
    label: "Johannesburg — South Africa Time",
    keywords: "south africa",
  },
  {
    value: "Africa/Lagos",
    label: "Lagos — West Africa Time",
    keywords: "nigeria",
  },
  {
    value: "Africa/Cairo",
    label: "Cairo — Eastern European Time",
    keywords: "egypt",
  },
  {
    value: "Africa/Nairobi",
    label: "Nairobi — East Africa Time",
    keywords: "kenya",
  },
  // Middle East / Asia / Pacific
  {
    value: "Asia/Dubai",
    label: "Dubai — Gulf Time",
    keywords: "uae",
  },
  {
    value: "Asia/Kolkata",
    label: "Kolkata — India Time",
    keywords: "india mumbai delhi bangalore",
  },
  {
    value: "Asia/Singapore",
    label: "Singapore",
    keywords: "singapore",
  },
  {
    value: "Asia/Hong_Kong",
    label: "Hong Kong",
    keywords: "china",
  },
  {
    value: "Asia/Shanghai",
    label: "Shanghai — China Time",
    keywords: "china beijing",
  },
  {
    value: "Asia/Tokyo",
    label: "Tokyo — Japan Time",
    keywords: "japan",
  },
  {
    value: "Asia/Seoul",
    label: "Seoul — Korea Time",
    keywords: "korea",
  },
  {
    value: "Asia/Bangkok",
    label: "Bangkok — Indochina Time",
    keywords: "thailand",
  },
  {
    value: "Asia/Jakarta",
    label: "Jakarta — Western Indonesia Time",
    keywords: "indonesia",
  },
  {
    value: "Asia/Manila",
    label: "Manila — Philippines Time",
    keywords: "philippines",
  },
  {
    value: "Australia/Sydney",
    label: "Sydney — Australian Eastern Time",
    keywords: "australia",
  },
  {
    value: "Australia/Melbourne",
    label: "Melbourne — Australian Eastern Time",
    keywords: "australia",
  },
  {
    value: "Australia/Perth",
    label: "Perth — Australian Western Time",
    keywords: "australia",
  },
  {
    value: "Pacific/Auckland",
    label: "Auckland — New Zealand Time",
    keywords: "new zealand",
  },
  {
    value: "UTC",
    label: "UTC — Coordinated Universal Time",
    keywords: "gmt universal",
  },
];

/** IANA values only — backward compatible with existing Select maps. */
export const TIMEZONES = TIMEZONE_OPTIONS.map((o) => o.value);

export function timezoneLabel(iana: string | null | undefined): string {
  if (!iana) return "Timezone";
  const hit = TIMEZONE_OPTIONS.find((o) => o.value === iana);
  return hit?.label ?? iana;
}

export function filterTimezoneOptions(
  query: string,
  options: TimezoneOption[] = TIMEZONE_OPTIONS,
): TimezoneOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => {
    const hay = `${o.value} ${o.label} ${o.keywords ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

/** Ensure a saved IANA value remains selectable even if not in the curated list. */
export function withSavedTimezone(
  saved: string | null | undefined,
  options: TimezoneOption[] = TIMEZONE_OPTIONS,
): TimezoneOption[] {
  if (!saved) return options;
  if (options.some((o) => o.value === saved)) return options;
  return [{ value: saved, label: saved, keywords: saved }, ...options];
}
