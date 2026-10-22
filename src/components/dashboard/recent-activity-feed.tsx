import { Activity, Award, Sparkles, Stamp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmptyState,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecentActivityItem } from "@/dal/stats";

interface RecentActivityFeedProps {
  activities: RecentActivityItem[];
}

const formatDate = (date: Date): string => {
  const d = new Date(date);
  const dayMonth = d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dayMonth} à ${time}`;
};

const renderTypeBadge = (type: RecentActivityItem["type"], label: string) => {
  if (type === "redeem") {
    return (
      <Badge variant="warning" size="sm" className="gap-1 font-semibold">
        <Award className="h-3 w-3 shrink-0" />
        <span>{label}</span>
      </Badge>
    );
  }

  if (type === "points") {
    return (
      <Badge variant="accent" size="sm" className="gap-1 font-semibold">
        <Sparkles className="h-3 w-3 shrink-0" />
        <span>{label}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="brand" size="sm" className="gap-1 font-semibold">
      <Stamp className="h-3 w-3 shrink-0" />
      <span>{label}</span>
    </Badge>
  );
};

export const RecentActivityFeed = ({ activities }: RecentActivityFeedProps) => (
  <Card className="overflow-hidden shadow-xs">
    <CardHeader className="border-border border-b p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-base sm:text-lg">
            Transactions & Passages Récents
          </CardTitle>
          <CardDescription className="mt-1">
            Flux en direct des passages en caisse et des récompenses débloquées
          </CardDescription>
        </div>
        <Badge variant="neutral" size="sm">
          {activities.length} récentes
        </Badge>
      </div>
    </CardHeader>

    {activities.length === 0 ? (
      <TableEmptyState
        icon={<Activity className="h-6 w-6" />}
        title="Aucune transaction récente"
        description="Les passages en caisse et récompenses apparaîtront ici dès le premier scan."
      />
    ) : (
      <Table className="rounded-none border-0">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Client</TableHead>
            <TableHead className="w-[20%]">Opération</TableHead>
            <TableHead className="w-[18%] text-right">Pts / Tampons</TableHead>
            <TableHead className="w-[17%] text-right">Montant</TableHead>
            <TableHead className="w-[15%] text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((act) => {
            const isRedeem = act.type === "redeem";

            return (
              <TableRow key={act.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold">
                      {act.initials}
                    </div>
                    <span className="text-foreground font-semibold">
                      {act.customerName}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  {renderTypeBadge(act.type, act.typeLabel)}
                </TableCell>

                <TableCell className="text-right font-bold">
                  <span
                    className={
                      isRedeem
                        ? "text-primary font-bold"
                        : "font-bold text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {act.deltaText}
                  </span>
                </TableCell>

                <TableCell className="text-muted-foreground text-right font-medium">
                  {act.spendText}
                </TableCell>

                <TableCell className="text-muted-foreground text-right text-xs whitespace-nowrap">
                  {formatDate(act.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    )}
  </Card>
);
