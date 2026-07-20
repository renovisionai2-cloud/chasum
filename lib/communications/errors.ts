/** Thrown when a background job should fail without retrying (misconfig / missing data). */
export class PermanentDeliverySkip extends Error {
  readonly permanent = true as const;

  constructor(message: string) {
    super(message);
    this.name = "PermanentDeliverySkip";
  }
}

export function isPermanentDeliverySkip(err: unknown): err is PermanentDeliverySkip {
  return (
    err instanceof PermanentDeliverySkip ||
    (err instanceof Error &&
      (err.name === "PermanentDeliverySkip" ||
        (err as { permanent?: boolean }).permanent === true))
  );
}
