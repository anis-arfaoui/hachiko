import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  error?: string;
}

export const Input = ({
  className,
  containerClassName,
  disabled,
  error,
  type = "text",
  ...props
}: InputProps) => (
  <div className={cn("w-full", containerClassName)}>
    <input
      className={cn(
        "border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring focus:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus:ring-2 focus:outline-none focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-destructive focus-visible:ring-destructive",
        className
      )}
      disabled={disabled}
      type={type}
      {...props}
    />
    {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
  </div>
);
