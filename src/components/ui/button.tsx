import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  children: ReactNode;
  isLoading?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  type?: "button" | "submit" | "reset";
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "ghost"
    | "soft";
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-[0.99]",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs active:scale-[0.99]",
  ghost: "hover:bg-muted hover:text-foreground",
  outline:
    "border border-border bg-card hover:bg-muted/60 text-foreground shadow-xs active:scale-[0.99]",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.99]",
  soft: "bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.99]",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2 text-sm",
  icon: "h-10 w-10 p-2",
  lg: "h-12 px-6 text-base font-semibold",
  sm: "h-8 px-3 text-xs font-medium",
};

export const Button = ({
  children,
  className,
  disabled,
  isLoading = false,
  size = "default",
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) => {
  const commonClassName = cn(
    "focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-all select-none focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  const content = (
    <>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </>
  );

  if (type === "submit") {
    return (
      <button
        {...props}
        className={commonClassName}
        disabled={disabled || isLoading}
        type="submit"
      >
        {content}
      </button>
    );
  }

  if (type === "reset") {
    return (
      <button
        {...props}
        className={commonClassName}
        disabled={disabled || isLoading}
        type="reset"
      >
        {content}
      </button>
    );
  }

  return (
    <button
      {...props}
      className={commonClassName}
      disabled={disabled || isLoading}
      type="button"
    >
      {content}
    </button>
  );
};
