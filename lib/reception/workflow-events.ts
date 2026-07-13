export type ReceptionQuickAction =
  | "new-customer"
  | "book-appointment"
  | "walk-in"
  | "block-time"
  | "add-note"
  | "focus-customer-search";

export const RECEPTION_ACTION_EVENT = "chasum-reception-action";
export const COMMAND_PALETTE_EVENT = "chasum-open-command-palette";

export type ReceptionActionDetail = {
  action: ReceptionQuickAction;
};

export function dispatchReceptionAction(action: ReceptionQuickAction) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ReceptionActionDetail>(RECEPTION_ACTION_EVENT, {
      detail: { action },
    }),
  );
}

export function dispatchOpenCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COMMAND_PALETTE_EVENT));
}
