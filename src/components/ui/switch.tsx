"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps {
  ariaLabel?: string;
  checked: boolean;
  className?: string;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
  label?: ReactNode;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = ({
  ariaLabel,
  checked,
  className,
  description,
  disabled = false,
  id,
  label,
  onCheckedChange,
}: SwitchProps) => (
  <label
    htmlFor={id}
    className={cn(
      "flex items-center justify-between gap-3 select-none",
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      className
    )}
  >
    {(label || description) && (
      <div className="space-y-0.5">
        {label && (
          <span className="text-foreground text-sm font-medium">{label}</span>
        )}
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
    )}

    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || "Basculer l'état"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "focus-visible:ring-ring relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  </label>
);
