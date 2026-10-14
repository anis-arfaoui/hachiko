import { Award, Sparkles, Stamp } from "lucide-react";

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

const getTypeBadgeStyle = (type: string): string => {
  if (type === "redeem") {
    return "bg-secondary text-primary border border-primary/20";
  }
  if (type === "points") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "bg-primary/10 text-primary";
};

const renderTypeIcon = (type: string) => {
  if (type === "redeem") {
    return <Award className="h-3 w-3" />;
  }
  if (type === "points") {
    return <Sparkles className="h-3 w-3" />;
  }
  return <Stamp className="h-3 w-3" />;
};

export const RecentActivityFeed = ({ activities }: RecentActivityFeedProps) => (
  <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs">
    <div className="border-border border-b p-6">
      <h2 className="text-foreground text-base font-bold">
        Transactions & Passages Récents
      </h2>
      <p className="text-muted-foreground mt-0.5 text-xs">
        Flux en temps réel des passages en caisse et des cadeaux offerts
      </p>
    </div>

    <div className="overflow-x-auto">
      {activities.length === 0 ? (
        <div className="text-muted-foreground flex h-36 items-center justify-center text-xs">
          Aucune transaction récente enregistrée.
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-border text-muted-foreground border-b font-semibold tracking-wider uppercase">
              <th scope="col" className="px-6 py-3.5">
                Client
              </th>
              <th scope="col" className="px-6 py-3.5">
                Type
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Pts / Tampons
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Montant
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {activities.map((act) => {
              const isRedeem = act.type === "redeem";

              return (
                <tr
                  key={act.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="px-6 py-3.5" aria-label={act.customerName}>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                        {act.initials}
                      </div>
                      <span className="text-foreground font-semibold">
                        {act.customerName}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getTypeBadgeStyle(act.type)}`}
                    >
                      {renderTypeIcon(act.type)}
                      <span>{act.typeLabel}</span>
                    </span>
                  </td>

                  <td className="px-6 py-3.5 text-right font-bold">
                    <span
                      className={
                        isRedeem
                          ? "text-primary font-bold"
                          : "font-bold text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {act.deltaText}
                    </span>
                  </td>

                  <td className="text-muted-foreground px-6 py-3.5 text-right font-medium">
                    {act.spendText}
                  </td>

                  <td className="text-muted-foreground px-6 py-3.5 text-right whitespace-nowrap">
                    {formatDate(act.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  </div>
);
