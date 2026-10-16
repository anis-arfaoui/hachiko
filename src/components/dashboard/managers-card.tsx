import { ChevronRight, Shield, Smartphone } from "lucide-react";
import Link from "next/link";

import type { ManagerItem } from "@/dal/manager";

interface ManagersCardProps {
  managers: ManagerItem[];
  orgName: string;
}

const formatDateShort = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDate();
  const months = [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];
  return `${day} ${months[d.getMonth()]}`;
};

export const ManagersCard = ({ managers, orgName }: ManagersCardProps) => (
  <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-rose-500" />
        <h3 className="text-foreground text-sm font-bold">Vos responsables</h3>
      </div>
      <Link
        href="/responsables"
        className="flex items-center gap-0.5 text-xs font-semibold text-rose-500 transition-colors hover:text-rose-600"
      >
        <span>Gérer</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>

    <div className="mt-4">
      {managers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-foreground text-sm font-medium">
            Aucun responsable configuré pour le moment.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Déléguez la gestion de votre commerce en toute sécurité.
          </p>
          <Link
            href="/responsables"
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ajouter un responsable
          </Link>
        </div>
      ) : (
        <div className="divide-border divide-y">
          {managers.map((mgr) => {
            const initial = mgr.name.trim().charAt(0).toUpperCase() || "R";
            return (
              <div
                key={mgr.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-sm font-bold text-rose-600">
                    {initial}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-bold">
                      {mgr.name}
                    </p>
                    <p className="text-muted-foreground text-xs">{orgName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>
                    {mgr.lastActiveAt
                      ? `actif ${formatDateShort(mgr.lastActiveAt)}`
                      : `depuis le ${formatDateShort(mgr.createdAt)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);
