import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

export interface StatCardProps {
  className?: string;
  color?: "brand" | "emerald" | "amber" | "sky";
  icon: ComponentType<{ className?: string }>;
  subtitle?: string;
  title: string;
  trend?: {
    isPositive?: boolean;
    value: string;
  };
  unit?: string;
  value: number | string;
}

const colorStyles = {
  amber: {
    badge: "text-amber-600 bg-amber-500/10",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  brand: {
    badge: "text-primary bg-primary/10",
    iconBg: "bg-primary/10 text-primary dark:text-primary",
  },
  emerald: {
    badge: "text-emerald-600 bg-emerald-500/10",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  sky: {
    badge: "text-sky-600 bg-sky-500/10",
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
};

export const StatCard = ({
  className,
  color = "brand",
  icon: Icon,
  subtitle,
  title,
  trend,
  unit,
  value,
}: StatCardProps) => {
  const scheme = colorStyles[color];

  return (
    <div
      className={cn(
        "border-border bg-card hover:border-primary/30 relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {title}
        </span>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform",
            scheme.iconBg
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-foreground flex items-baseline gap-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span>{value}</span>
          {unit && (
            <span className="text-muted-foreground text-sm font-semibold">
              {unit}
            </span>
          )}
        </div>

        {(subtitle || trend) && (
          <div className="mt-2 flex items-center justify-between text-xs">
            {subtitle && (
              <span className="text-muted-foreground truncate">{subtitle}</span>
            )}
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 font-bold tracking-tight",
                  trend.isPositive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
