"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface DashboardHeaderProps {
  locale: string;
  orgSlug: string;
}

export const DashboardHeader = ({ locale, orgSlug }: DashboardHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const relativePath = `/j/${orgSlug}`;

  const handleCopy = () => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const fullJoinUrl = origin
      ? `${origin}/${locale}/j/${orgSlug}`
      : relativePath;

    navigator.clipboard.writeText(fullJoinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Title without pulsing Live badge */}
      <div>
        <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Aperçu de l&apos;activité et de la fidélisation de vos clients.
        </p>
      </div>

      {/* Client Join Link Box */}
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
          Lien client
        </span>

        <div className="border-border bg-card flex items-center gap-1.5 rounded-xl border p-1.5 shadow-xs">
          <span className="text-muted-foreground max-w-[180px] truncate px-2 font-mono text-xs sm:max-w-[240px]">
            {relativePath}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            title="Copier le lien d'inscription"
            className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="text-primary h-3.5 w-3.5" />
                <span className="text-primary font-semibold">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>

          <a
            href={`/${locale}/j/${orgSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir la page client dans un nouvel onglet"
            className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
