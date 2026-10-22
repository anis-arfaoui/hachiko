import type { ComponentType, InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  error?: string;
  icon?: ComponentType<{ className?: string }>;
  rightElement?: ReactNode;
}

export const Input = ({
  className,
  containerClassName,
  disabled,
  error,
  icon: Icon,
  rightElement,
  type = "text",
  ...props
}: InputProps) => (
  <div className={cn("relative w-full", containerClassName)}>
    {Icon && (
      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <Icon className="h-4 w-4" />
      </div>
    )}
    <input
      className={cn(
        "border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3.5 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        Icon && "pl-10",
        rightElement && "pr-10",
        error && "border-destructive focus-visible:ring-destructive",
        className
      )}
      disabled={disabled}
      type={type}
      {...props}
    />
    {rightElement && (
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {rightElement}
      </div>
    )}
    {error && (
      <p className="text-destructive mt-1 text-xs font-medium">{error}</p>
    )}
  </div>
);
