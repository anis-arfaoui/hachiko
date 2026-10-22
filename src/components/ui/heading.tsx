import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const levelStyles: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground",
  2: "text-xl sm:text-2xl font-bold tracking-tight text-foreground",
  3: "text-lg sm:text-xl font-bold tracking-tight text-foreground",
  4: "text-base sm:text-lg font-semibold tracking-tight text-foreground",
  5: "text-sm sm:text-base font-semibold tracking-tight text-foreground",
  6: "text-xs font-bold uppercase tracking-wider text-muted-foreground",
};

export const Heading = ({
  children,
  className,
  level = 1,
  ...props
}: HeadingProps) => {
  const Component = `h${level}` as const;
  return (
    <Component
      className={cn("font-heading", levelStyles[level], className)}
      {...props}
    >
      {children}
    </Component>
  );
};
