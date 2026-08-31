"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  filterTimezoneOptions,
  withSavedTimezone,
  type TimezoneOption,
  TIMEZONE_OPTIONS,
} from "@/lib/constants/timezones";
import { useMemo, useState, type ChangeEvent } from "react";

type TimezoneSelectProps = {
  id?: string;
  name?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (iana: string) => void;
  options?: TimezoneOption[];
};

/**
 * Searchable IANA timezone picker — stores canonical zone ids.
 */
export function TimezoneSelect({
  id = "timezone",
  name = "timezone",
  label = "Timezone",
  value,
  defaultValue,
  required,
  disabled,
  onChange,
  options = TIMEZONE_OPTIONS,
}: TimezoneSelectProps) {
  const [query, setQuery] = useState("");
  const current = value ?? defaultValue ?? "";
  const catalog = useMemo(
    () => withSavedTimezone(current, options),
    [current, options],
  );
  const filtered = useMemo(
    () => filterTimezoneOptions(query, catalog),
    [query, catalog],
  );

  const filteredWithSelection = useMemo(() => {
    if (current && !filtered.some((tz) => tz.value === current)) {
      const selected =
        catalog.find((tz) => tz.value === current) ?? {
          value: current,
          label: current,
        };
      return [selected, ...filtered];
    }
    return filtered;
  }, [catalog, current, filtered]);

  const selectProps =
    value !== undefined
      ? {
          value,
          onChange: (e: ChangeEvent<HTMLSelectElement>) =>
            onChange?.(e.target.value),
        }
      : {
          defaultValue: defaultValue ?? "",
          onChange: onChange
            ? (e: ChangeEvent<HTMLSelectElement>) =>
                onChange(e.target.value)
            : undefined,
        };

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search city or region (e.g. Toronto, Canada)"
        disabled={disabled}
        aria-label="Search timezones"
        autoComplete="off"
        required={false}
        form="chasum-timezone-filter"
      />
      <Select
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        {...selectProps}
      >
        {filteredWithSelection.length === 0 ? (
          <option value="" disabled>
            No matches — clear search
          </option>
        ) : (
          filteredWithSelection.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))
        )}
      </Select>
      <p className="text-[11px] text-muted-foreground">
        Saved as IANA id
        {current ? (
          <>
            : <span className="font-medium text-foreground">{current}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
