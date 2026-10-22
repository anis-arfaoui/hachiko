import { ChevronRight, ShieldCheck, Smartphone, UserPlus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  <Card className="p-5 shadow-xs sm:p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-xl">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-foreground text-sm font-bold">
              Vos Responsables
            </h3>
            <Badge variant="neutral" size="sm">
              {managers.length}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Gestionnaires autorisés sur {orgName}
          </p>
        </div>
      </div>

      <Link href="/responsables">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs font-semibold"
        >
          <span>Gérer</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>

    <div className="mt-4">
      {managers.length === 0 ? (
        <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-6 text-center">
          <p className="text-foreground text-sm font-semibold">
            Aucun responsable configuré
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-xs">
            Déléguez la supervision de vos points de vente et caisses en toute
            sécurité.
          </p>
          <Link href="/responsables" className="mt-3">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <UserPlus className="h-3.5 w-3.5" />
              <span>Ajouter un responsable</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="divide-border divide-y">
          {managers.map((mgr) => {
            const initial = mgr.name.trim().charAt(0).toUpperCase() || "R";
            return (
              <div
                key={mgr.id}
                className="flex items-center justify-between py-3 first:pt-1 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold">
                    {initial}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-bold">
                      {mgr.name}
                    </p>
                    <p className="text-muted-foreground text-xs">{orgName}</p>
                  </div>
                </div>

                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>
                    {mgr.lastActiveAt
                      ? `actif ${formatDateShort(mgr.lastActiveAt)}`
                      : `créé le ${formatDateShort(mgr.createdAt)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </Card>
);
