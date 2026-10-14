import { BarChart3, TrendingUp } from "lucide-react";

import type { DailyVisit } from "@/dal/stats";

interface AnalyticsSectionProps {
  dailyVisits: DailyVisit[];
  peakDailyVisits: number;
  repeatCustomersCount: number;
  repeatRate: number;
  totalNewThisMonth: number;
  totalVisits30Days: number;
}

export const AnalyticsSection = ({
  dailyVisits,
  peakDailyVisits,
  repeatCustomersCount,
  repeatRate,
  totalNewThisMonth,
  totalVisits30Days,
}: AnalyticsSectionProps) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
    {/* Left: 30-Day Visits Bar Chart */}
    <div className="border-border bg-card flex flex-col justify-between rounded-2xl border p-6 shadow-xs lg:col-span-8">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="text-primary h-4 w-4" />
              <h2 className="text-foreground text-sm font-bold">
                Activité des Visites
              </h2>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-foreground text-3xl font-extrabold tracking-tight">
                {totalVisits30Days}
              </span>
              <span className="text-muted-foreground text-xs font-medium">
                visites sur les 30 derniers jours
              </span>
            </div>
          </div>

          <div className="border-border bg-muted/50 rounded-lg border px-2.5 py-1 text-xs font-semibold">
            Pic : {peakDailyVisits} / jour
          </div>
        </div>
      </div>

      {/* 30-Day Bar Graphic */}
      <div className="mt-8">
        <div className="flex h-32 items-end justify-between gap-1 sm:gap-1.5">
          {dailyVisits.map((item) => {
            const hasVisits = item.visits > 0;
            const heightPercent =
              peakDailyVisits > 0 && hasVisits
                ? Math.max(
                    16,
                    Math.round((item.visits / peakDailyVisits) * 100)
                  )
                : 6;

            return (
              <div
                key={item.date}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                {/* Tooltip on hover */}
                <div className="bg-popover text-popover-foreground border-border pointer-events-none absolute -top-8 z-20 hidden -translate-x-1/2 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-sm group-hover:block">
                  {item.visits} passage{item.visits > 1 ? "s" : ""}
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    hasVisits
                      ? "bg-primary group-hover:bg-primary/80"
                      : "bg-muted/80 group-hover:bg-muted-foreground/30"
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="border-border text-muted-foreground mt-3 flex items-center justify-between border-t pt-2 text-xs">
          <span>Il y a 30 jours</span>
          <span>Aujourd&apos;hui</span>
        </div>
      </div>
    </div>

    {/* Right: Rétention & Fidélité */}
    <div className="border-border bg-card flex flex-col justify-between rounded-2xl border p-6 shadow-xs lg:col-span-4">
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">
            Taux de Rétention
          </h2>
        </div>

        <div className="mt-4">
          <div className="text-foreground text-4xl font-extrabold tracking-tight">
            {repeatRate}%
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            de clients revenus au moins 2 fois
          </p>
        </div>
      </div>

      {/* Breakdown boxes */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="border-border bg-muted/40 rounded-xl border p-3.5">
          <div className="text-foreground text-2xl font-bold">
            {totalNewThisMonth}
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            Nouveaux ce mois
          </div>
        </div>

        <div className="border-border bg-muted/40 rounded-xl border p-3.5">
          <div className="text-foreground text-2xl font-bold">
            {repeatCustomersCount}
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            Fidèles revenus
          </div>
        </div>
      </div>
    </div>
  </div>
);
