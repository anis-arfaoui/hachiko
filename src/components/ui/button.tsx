import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  children: ReactNode;
  size?: "default" | "sm" | "lg" | "icon";
  type?: "button" | "submit" | "reset";
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost";
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  ghost: "hover:bg-muted hover:text-foreground",
  outline:
    "border border-border bg-card hover:bg-muted text-foreground shadow-sm",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2 text-sm",
  icon: "h-10 w-10 p-2",
  lg: "h-12 px-8 text-base",
  sm: "h-8 px-3 text-xs",
};

export const Button = ({
  children,
  className,
  disabled,
  size = "default",
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) => {
  const commonClassName = cn(
    "focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-colors select-none focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  if (type === "submit") {
    return (
      <button
        {...props}
        className={commonClassName}
        disabled={disabled}
        type="submit"
      >
        {children}
      </button>
    );
  }

  if (type === "reset") {
    return (
      <button
        {...props}
        className={commonClassName}
        disabled={disabled}
        type="reset"
      >
        {children}
      </button>
    );
  }

  return (
    <button
      {...props}
      className={commonClassName}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};
