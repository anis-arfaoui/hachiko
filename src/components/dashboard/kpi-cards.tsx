import { Award, CreditCard, Sparkles, Users } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";

interface KpiCardsProps {
  totalCustomers: number;
  totalRevenueDA: number;
  totalRewardsRedeemed: number;
  totalTransactions: number;
}

export const KpiCards = ({
  totalCustomers,
  totalRevenueDA,
  totalRewardsRedeemed,
  totalTransactions,
}: KpiCardsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {/* 1. CA GÉNÉRÉ */}
    <StatCard
      title="CA GÉNÉRÉ"
      value={totalRevenueDA.toLocaleString("fr-FR")}
      unit="DA"
      icon={CreditCard}
      color="brand"
      subtitle="Chiffre estimé (30 jours)"
    />

    {/* 2. CLIENTS */}
    <StatCard
      title="CLIENTS"
      value={totalCustomers.toLocaleString("fr-FR")}
      icon={Users}
      color="sky"
      subtitle="Clients enregistrés"
    />

    {/* 3. TRANSACTIONS */}
    <StatCard
      title="TRANSACTIONS"
      value={totalTransactions.toLocaleString("fr-FR")}
      icon={Sparkles}
      color="emerald"
      subtitle="Passages validés en caisse"
    />

    {/* 4. RÉCOMPENSES */}
    <StatCard
      title="RÉCOMPENSES"
      value={totalRewardsRedeemed.toLocaleString("fr-FR")}
      icon={Award}
      color="amber"
      subtitle="Cadeaux et remises offerts"
    />
  </div>
);
