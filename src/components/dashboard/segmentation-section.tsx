import { Clock, Trophy } from "lucide-react";

import type { InactiveCustomerItem, TopCustomerItem } from "@/dal/stats";

interface SegmentationSectionProps {
  inactiveCustomers: InactiveCustomerItem[];
  topCustomers: TopCustomerItem[];
}

export const SegmentationSection = ({
  inactiveCustomers,
  topCustomers,
}: SegmentationSectionProps) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {/* 1. Meilleurs clients */}
    <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
          <Trophy className="h-4 w-4" />
        </div>
        <h2 className="text-foreground text-sm font-bold">
          Clients les Plus Fidèles (VIP)
        </h2>
      </div>

      <div className="mt-4">
        {topCustomers.length === 0 ? (
          <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
            Aucun passage enregistré pour le moment.
          </div>
        ) : (
          <div className="divide-border divide-y">
            {topCustomers.map((cust, idx) => (
              <div
                key={cust.id}
                className="flex items-center justify-between py-3 text-xs first:pt-1 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-foreground font-semibold">
                    {cust.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {cust.visits} visite{cust.visits > 1 ? "s" : ""}
                  </span>
                  <span className="text-primary font-bold">
                    {cust.spendDA.toLocaleString()} DA
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* 2. Clients à relancer */}
    <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
      <div className="flex items-center gap-2">
        <div className="bg-muted text-muted-foreground flex h-7 w-7 items-center justify-center rounded-lg">
          <Clock className="h-4 w-4" />
        </div>
        <h2 className="text-foreground text-sm font-bold">
          Clients à Relancer
        </h2>
      </div>

      <div className="mt-4">
        {inactiveCustomers.length === 0 ? (
          <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
            Tous vos clients sont actifs récemment. 🎉
          </div>
        ) : (
          <div className="divide-border divide-y">
            {inactiveCustomers.map((cust) => (
              <div
                key={cust.id}
                className="flex items-center justify-between py-3 text-xs first:pt-1 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold">
                    {cust.name}
                  </span>
                  <span className="text-muted-foreground">({cust.phone})</span>
                </div>

                <div className="bg-destructive/10 text-destructive rounded-md px-2 py-0.5 text-[11px] font-medium">
                  Inactif depuis {cust.daysInactive} jours
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
