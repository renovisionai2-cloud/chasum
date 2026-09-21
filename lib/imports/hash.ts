import { createHash } from "node:crypto";
/** Arrays retain order here; callers sort only collections declared unordered. */
export function canonicalSerialize(value: unknown): string {
    if (value === null || typeof value === "boolean" || typeof value === "string")
        return JSON.stringify(value);
    if (typeof value === "number" && Number.isFinite(value))
        return JSON.stringify(value);
    if (Array.isArray(value))
        return `[${value.map(canonicalSerialize).join(",")}]`;
    if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
        return `{${Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined).sort(([a], [b]) => compare(a, b)).map(([k, v]) => `${JSON.stringify(k)}:${canonicalSerialize(v)}`).join(",")}}`;
    }
    throw new Error("Non-canonical value");
}
export const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export const hash = (value: unknown) => createHash("sha256").update(canonicalSerialize(value)).digest("hex");
export const unordered = <T>(items: T[]): T[] => [...items].sort((a, b) => compare(canonicalSerialize(a), canonicalSerialize(b)));
