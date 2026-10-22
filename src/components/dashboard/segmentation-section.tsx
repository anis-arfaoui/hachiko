import { Clock, Crown, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="shadow-xs">
      <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-xl">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base">
                Clients les Plus Fidèles (VIP)
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                Classement selon le volume de passages et dépenses
              </p>
            </div>
          </div>
          <Badge variant="brand" size="sm">
            Top {topCustomers.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
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
                    {idx === 0 ? (
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      idx + 1
                    )}
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
                    {cust.spendDA.toLocaleString("fr-FR")} DA
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* 2. Clients à relancer */}
    <Card className="shadow-xs">
      <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-xl">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base">
                Clients à Relancer
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                Clients sans passage depuis plus de 30 jours
              </p>
            </div>
          </div>
          <Badge variant="warning" size="sm">
            {inactiveCustomers.length} à relancer
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
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

                <Badge variant="destructive" size="sm">
                  Inactif depuis {cust.daysInactive} jours
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
