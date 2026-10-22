import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Heading } from "@/components/ui/heading";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  actions?: ReactNode;
  backLink?: {
    href: string;
    label?: string;
  };
  badge?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
}

export const PageHeader = ({
  actions,
  backLink,
  badge,
  className,
  description,
  title,
}: PageHeaderProps) => (
  <div className={cn("space-y-2 pb-2", className)}>
    {backLink && (
      <Link
        href={backLink.href}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{backLink.label || "Retour"}</span>
      </Link>
    )}

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <Heading level={1} className="text-foreground tracking-tight">
            {title}
          </Heading>
          {badge}
        </div>
        {description && (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {actions}
        </div>
      )}
    </div>
  </div>
);
