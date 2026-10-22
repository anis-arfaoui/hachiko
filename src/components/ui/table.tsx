import type {
  HTMLAttributes,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export const Table = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) => (
  <div className="border-border bg-card relative w-full overflow-auto rounded-xl border">
    <table
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
);

export const TableHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("bg-muted/40 [&_tr]:border-b", className)} {...props} />
);

export const TableBody = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody
    className={cn(
      "divide-border divide-y [&_tr:last-child]:border-0",
      className
    )}
    {...props}
  />
);

export const TableFooter = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <tfoot
    className={cn(
      "border-border bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
);

export const TableRow = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      "border-border hover:bg-muted/40 data-[state=selected]:bg-muted border-b transition-colors",
      className
    )}
    {...props}
  />
);

export const TableHead = ({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "text-muted-foreground h-11 px-4 text-left align-middle text-xs font-semibold tracking-wider uppercase [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
);

export const TableCell = ({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn(
      "text-foreground p-4 align-middle text-sm [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
);

export const TableCaption = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableCaptionElement>) => (
  <caption
    className={cn("text-muted-foreground mt-4 text-xs", className)}
    {...props}
  />
);

export interface TableEmptyStateProps {
  action?: ReactNode;
  description?: string;
  icon?: ReactNode;
  title: string;
}

export const TableEmptyState = ({
  action,
  description,
  icon,
  title,
}: TableEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
    {icon && (
      <div className="bg-muted/60 text-muted-foreground mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
        {icon}
      </div>
    )}
    <h4 className="text-foreground text-base font-semibold">{title}</h4>
    {description && (
      <p className="text-muted-foreground mt-1 max-w-sm text-xs">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
