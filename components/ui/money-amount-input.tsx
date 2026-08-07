"use client";

import { Input } from "@/components/ui/input";
import {
  formatMoneyAmountDraft,
  isAllowedMoneyAmountDraft,
  normalizeMoneyAmountDraft,
  parseMoneyAmountDraft,
} from "@/lib/commerce/money-amount-input";
import { cn } from "@/lib/utils";
import {
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

export type MoneyAmountInputProps = {
  id?: string;
  amountCents: number;
  onAmountCentsChange: (cents: number) => void;
  className?: string;
  disabled?: boolean;
  /**
   * When true, first focus of a non-zero amount selects the whole value
   * so typing replaces the default/recommended amount in one motion.
   */
  selectAllOnFirstFocus?: boolean;
  "aria-label"?: string;
};

/**
 * High-quality monetary amount field.
 * Focused: plain draft text (allows temporary empty / partial decimals).
 * Blur: currency-safe normalization to cents + two-decimal display.
 */
export function MoneyAmountInput({
  id,
  amountCents,
  onAmountCentsChange,
  className,
  disabled,
  selectAllOnFirstFocus = true,
  "aria-label": ariaLabel,
}: MoneyAmountInputProps) {
  const [focused, setFocused] = useState(false);
  /** Local draft only while focused; null means show committed amountCents. */
  const [draft, setDraft] = useState<string | null>(null);
  const didSelectOnFocus = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const display =
    focused && draft !== null ? draft : formatMoneyAmountDraft(amountCents);

  function commitDraft(raw: string) {
    const { cents } = normalizeMoneyAmountDraft(raw, amountCents);
    setDraft(null);
    if (cents !== amountCents) {
      onAmountCentsChange(cents);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!isAllowedMoneyAmountDraft(raw)) return;
    setDraft(raw);
    if (raw === "" || raw === ".") {
      // Temporary empty editing state — keep field blank; treat as $0 for live projection.
      if (amountCents !== 0) onAmountCentsChange(0);
      return;
    }
    const parsed = parseMoneyAmountDraft(raw);
    if (parsed != null && parsed !== amountCents) {
      onAmountCentsChange(parsed);
    }
  }

  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    setFocused(true);
    setDraft(formatMoneyAmountDraft(amountCents));
    if (
      selectAllOnFirstFocus &&
      !didSelectOnFocus.current &&
      amountCents > 0
    ) {
      didSelectOnFocus.current = true;
      const el = e.currentTarget;
      requestAnimationFrame(() => {
        el.select();
      });
    }
  }

  function handleBlur() {
    const raw = draft ?? formatMoneyAmountDraft(amountCents);
    setFocused(false);
    commitDraft(raw);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Prevent Enter from submitting the surrounding booking form accidentally.
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  }

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn("tabular-nums", className)}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
