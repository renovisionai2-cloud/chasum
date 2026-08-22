/**
 * Deterministic revision token for remounting uncontrolled forms after save.
 *
 * React 19 resets native controls to mount-time defaultValue after a successful
 * form action. router.refresh() then delivers new server props, but defaultValue
 * does not update an already-mounted uncontrolled input. Keying <form> on this
 * token remounts the controls once persisted values change.
 *
 * JSON serialization keeps string/number/boolean/null distinct and does not
 * collide when free-text contains separators such as "|".
 */
export type FormRevisionValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly FormRevisionValue[]
  | { readonly [key: string]: FormRevisionValue };

function canonical(value: FormRevisionValue): unknown {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.map((item) => canonical(item));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = canonical(value[key]);
    }
    return out;
  }
  return value;
}

export function persistedFormRevision(value: FormRevisionValue): string {
  return JSON.stringify(canonical(value));
}

export function catalogFormRevision(
  items: ReadonlyArray<{ id: string } & Record<string, FormRevisionValue>>,
): string {
  return persistedFormRevision(
    items.map((item) => ({
      ...item,
      id: item.id,
    })),
  );
}
