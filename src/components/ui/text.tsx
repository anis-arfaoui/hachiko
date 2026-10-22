import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: "p" | "span" | "div" | "label";
  children: ReactNode;
  variant?: "body" | "muted" | "small" | "caption" | "lead";
}

const variantStyles: Record<NonNullable<TextProps["variant"]>, string> = {
  body: "text-sm text-foreground leading-relaxed",
  caption: "text-[11px] text-muted-foreground leading-normal",
  lead: "text-base sm:text-lg text-muted-foreground leading-relaxed font-normal",
  muted: "text-sm text-muted-foreground leading-relaxed",
  small: "text-xs text-muted-foreground leading-normal",
};

export const Text = ({
  as: Component = "p",
  children,
  className,
  variant = "body",
  ...props
}: TextProps) => (
  <Component className={cn(variantStyles[variant], className)} {...props}>
    {children}
  </Component>
);
