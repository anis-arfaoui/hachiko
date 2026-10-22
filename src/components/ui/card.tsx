import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = ({ children, className, ...props }: CardProps) => (
  <div
    className={cn(
      "border-border bg-card text-card-foreground rounded-2xl border shadow-xs transition-colors",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className, ...props }: CardProps) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ children, className, ...props }: CardProps) => (
  <h3
    className={cn(
      "font-heading text-foreground text-lg leading-none font-bold tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({
  children,
  className,
  ...props
}: CardProps) => (
  <p
    className={cn(
      "text-muted-foreground text-xs leading-relaxed sm:text-sm",
      className
    )}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({ children, className, ...props }: CardProps) => (
  <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }: CardProps) => (
  <div
    className={cn("flex items-center p-5 pt-0 sm:p-6 sm:pt-0", className)}
    {...props}
  >
    {children}
  </div>
);
