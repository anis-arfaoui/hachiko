"use client";

import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TabItem {
  count?: number;
  icon?: ComponentType<{ className?: string }>;
  id: string;
  label: ReactNode;
}

export interface TabsProps {
  className?: string;
  items: TabItem[];
  onChange: (id: string) => void;
  selectedId: string;
  variant?: "pill" | "underline";
}

export const Tabs = ({
  className,
  items,
  onChange,
  selectedId,
  variant = "pill",
}: TabsProps) => {
  if (variant === "underline") {
    return (
      <div
        className={cn(
          "border-border flex items-center gap-6 overflow-x-auto border-b",
          className
        )}
        role="tablist"
      >
        {items.map((tab) => {
          const isSelected = tab.id === selectedId;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isSelected}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "group relative flex cursor-pointer items-center gap-2 pb-3 text-sm font-semibold whitespace-nowrap transition-colors",
                isSelected
                  ? "text-primary border-primary -mb-px border-b-2"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Pill / Segmented variant
  return (
    <div
      className={cn(
        "bg-muted/60 border-border/50 inline-flex items-center gap-1 rounded-xl border p-1",
        className
      )}
      role="tablist"
    >
      {items.map((tab) => {
        const isSelected = tab.id === selectedId;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isSelected}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all select-none",
              isSelected
                ? "bg-card text-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-extrabold",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
