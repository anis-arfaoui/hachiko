import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  dot?: boolean;
  size?: "sm" | "default" | "lg";
  variant?:
    | "brand"
    | "success"
    | "warning"
    | "destructive"
    | "neutral"
    | "outline"
    | "accent";
}

const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  accent: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  brand: "bg-primary/10 text-primary border-primary/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  neutral: "bg-muted text-muted-foreground border-border",
  outline: "border-border bg-card text-foreground",
  success:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const dotColors: Record<NonNullable<BadgeProps["variant"]>, string> = {
  accent: "bg-sky-500",
  brand: "bg-primary",
  destructive: "bg-destructive",
  neutral: "bg-muted-foreground",
  outline: "bg-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
};

const sizeStyles: Record<NonNullable<BadgeProps["size"]>, string> = {
  default: "px-2.5 py-0.5 text-xs font-semibold gap-1.5",
  lg: "px-3 py-1 text-sm font-semibold gap-2",
  sm: "px-2 py-0.5 text-[10px] font-bold gap-1",
};

export const Badge = ({
  children,
  className,
  dot = false,
  size = "default",
  variant = "brand",
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border transition-colors select-none",
      variantStyles[variant],
      sizeStyles[size],
      className
    )}
    {...props}
  >
    {dot && (
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColors[variant])}
      />
    )}
    {children}
  </span>
);
