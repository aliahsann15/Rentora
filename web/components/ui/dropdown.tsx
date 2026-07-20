"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "./icons";

export type DropdownOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type DropdownProps = {
  className?: string;
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  value: string;
};

export function Dropdown({
  className = "",
  disabled = false,
  error,
  label,
  onChange,
  options,
  placeholder = "Select option",
  value,
}: DropdownProps) {
  const dropdownId = useId();
  const rootRef = useRef<HTMLLabelElement | null>(null);
  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const selectOption = (option: DropdownOption) => {
    if (option.disabled) {
      return;
    }

    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <label className={["relative grid gap-2", className].join(" ")} ref={rootRef}>
      <span className="text-xs font-semibold text-text-primary">{label}</span>
      <button
        aria-controls={dropdownId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={[
          "flex h-11 w-full items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 text-left text-sm font-medium text-text-primary shadow-sm outline-none transition",
          "hover:border-text-muted disabled:bg-surface-muted disabled:text-text-muted",
          isOpen ? "border-text-primary" : "",
          error ? "border-danger" : "",
        ].join(" ")}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={["truncate", selectedOption ? "" : "text-text-muted"].join(" ")}>
          {selectedOption?.label || placeholder}
        </span>
        <FiChevronDown
          aria-hidden="true"
          className={["shrink-0 text-text-muted transition", isOpen ? "rotate-180" : ""].join(" ")}
          size={16}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-md border border-border bg-white p-1 shadow-[var(--rentora-shadow-panel)]"
          id={dropdownId}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                aria-selected={isSelected}
                className={[
                  "flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm font-semibold transition",
                  isSelected ? "bg-primary text-white" : "text-text-primary hover:bg-surface-muted",
                  option.disabled ? "pointer-events-none opacity-50" : "",
                ].join(" ")}
                key={option.value || option.label}
                onClick={() => selectOption(option)}
                role="option"
                type="button"
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {isSelected ? <FiCheck aria-hidden="true" size={14} /> : null}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}

          {!options.length ? (
            <div className="px-3 py-2.5 text-sm font-medium text-text-muted">No options</div>
          ) : null}
        </div>
      ) : null}

      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}
