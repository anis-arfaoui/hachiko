"use client";

import { Info, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface WalaaRoiCalculatorProps {
  locale?: string;
}

export const WalaaRoiCalculator = ({
  locale: _locale,
}: WalaaRoiCalculatorProps = {}) => {
  const [visits, setVisits] = useState(10);
  const [basket, setBasket] = useState(350);
  const [reward, setReward] = useState(500);

  const { avgBasket, clientsEstimate, extraVisits, netUplift } = useMemo(() => {
    const clients = Math.round(visits * 120);
    const additional = Math.round(clients * 3);
    const grossGain = additional * (basket * 0.35);
    const rewardCosts = clients * 0.4 * (reward * 0.15);
    const net = Math.max(15_000, Math.round(grossGain - rewardCosts));

    return {
      avgBasket: `${basket} DZD`,
      clientsEstimate: Number(clients).toLocaleString("fr-FR"),
      extraVisits: Number(additional).toLocaleString("fr-FR"),
      netUplift: Number(net).toLocaleString("fr-FR"),
    };
  }, [visits, basket, reward]);

  return (
    <div className="border-border bg-card shadow-border/50 mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-8 rounded-3xl border p-6 shadow-xl sm:p-10 lg:grid-cols-12">
      {/* Left Column: Sliders */}
      <div className="flex flex-col justify-between space-y-6 lg:col-span-7">
        {/* Slider 1 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="visits-range"
              className="text-foreground text-sm font-bold"
            >
              Vos visites moyennes par client
            </label>
            <span className="bg-primary/10 text-primary rounded-lg px-2.5 py-0.5 text-base font-extrabold">
              {visits}
            </span>
          </div>
          <input
            id="visits-range"
            type="range"
            min={1}
            max={30}
            value={visits}
            onChange={(e) => setVisits(Number(e.target.value))}
            className="bg-muted accent-primary h-2 w-full cursor-pointer rounded-lg"
          />
          <div className="text-muted-foreground mt-1 flex justify-between text-xs font-semibold">
            <span>1</span>
            <span>30</span>
          </div>
        </div>

        {/* Slider 2 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="basket-range"
              className="text-foreground text-sm font-bold"
            >
              Panier moyen par visite (DZD)
            </label>
            <span className="bg-primary/10 text-primary rounded-lg px-2.5 py-0.5 text-base font-extrabold">
              {basket}
            </span>
          </div>
          <input
            id="basket-range"
            type="range"
            min={100}
            max={1000}
            step={50}
            value={basket}
            onChange={(e) => setBasket(Number(e.target.value))}
            className="bg-muted accent-primary h-2 w-full cursor-pointer rounded-lg"
          />
          <div className="text-muted-foreground mt-1 flex justify-between text-xs font-semibold">
            <span>100</span>
            <span>1000</span>
          </div>
        </div>

        {/* Slider 3 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="reward-range"
              className="text-foreground text-sm font-bold"
            >
              Coût d&apos;une récompense (DZD)
            </label>
            <span className="bg-primary/10 text-primary rounded-lg px-2.5 py-0.5 text-base font-extrabold">
              {reward}
            </span>
          </div>
          <input
            id="reward-range"
            type="range"
            min={100}
            max={2000}
            step={50}
            value={reward}
            onChange={(e) => setReward(Number(e.target.value))}
            className="bg-muted accent-primary h-2 w-full cursor-pointer rounded-lg"
          />
          <div className="text-muted-foreground mt-1 flex justify-between text-xs font-semibold">
            <span>100</span>
            <span>2000</span>
          </div>
        </div>

        {/* Information Callout Box */}
        <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-2xl border p-4">
          <div className="bg-primary text-primary-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
            <Info className="h-3.5 w-3.5" />
          </div>
          <p className="text-foreground text-xs leading-snug sm:text-sm">
            Avec un programme de fidélité bien conçu, vous pouvez augmenter la
            rétention de vos clients <strong>jusqu&apos;à 60%</strong>.
          </p>
        </div>
      </div>

      {/* Right Column: Result Card */}
      <div className="from-navy-surface to-navy relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg sm:p-8 lg:col-span-5">
        {/* Glow circle */}
        <div className="bg-primary/30 pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full blur-3xl" />

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold tracking-wider text-white/80 uppercase">
            <span>Par mois (estimation)</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </span>
          </div>

          {/* Big Outcome Display */}
          <div className="my-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {netUplift}
            </span>
            <span className="text-lg font-bold text-white/90">DZD</span>
            <span className="ml-auto inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white">
              +42%
            </span>
          </div>
          <p className="mb-6 text-xs font-medium text-white/70">
            revenus additionnels estimés
          </p>

          {/* Metrics breakdown */}
          <div className="space-y-3 border-t border-white/10 pt-4 text-xs sm:text-sm">
            <div className="flex justify-between text-white/80">
              <span>Clients fidèles estimés</span>
              <span className="font-bold text-white">{clientsEstimate}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Visites supplémentaires</span>
              <span className="font-bold text-white">{extraVisits}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Panier moyen</span>
              <span className="font-bold text-white">{avgBasket}</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <Link
          href="/sign-up"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-bold shadow-md transition-colors"
        >
          Lancer mon programme <span className="ml-2">→</span>
        </Link>
      </div>
    </div>
  );
};
