import { Award, CreditCard, Sparkles, Users } from "lucide-react";

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
    <div className="border-border bg-card hover:border-primary/30 rounded-2xl border p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          CA Généré
        </span>
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
          <CreditCard className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-foreground text-3xl font-extrabold tracking-tight">
          {totalRevenueDA.toLocaleString()}
          <span className="text-muted-foreground ml-1.5 text-sm font-medium">
            DA
          </span>
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          30 derniers jours : {totalRevenueDA.toLocaleString()} DA
        </div>
      </div>
    </div>

    {/* 2. CLIENTS */}
    <div className="border-border bg-card hover:border-primary/30 rounded-2xl border p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Clients Inscrits
        </span>
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
          <Users className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-foreground text-3xl font-extrabold tracking-tight">
          {totalCustomers}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          Comptes clients enregistrés
        </div>
      </div>
    </div>

    {/* 3. TRANSACTIONS */}
    <div className="border-border bg-card hover:border-primary/30 rounded-2xl border p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Transactions
        </span>
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-foreground text-3xl font-extrabold tracking-tight">
          {totalTransactions}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          Passages validés en caisse
        </div>
      </div>
    </div>

    {/* 4. RÉCOMPENSES */}
    <div className="border-border bg-card hover:border-primary/30 rounded-2xl border p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Cadeaux Offerts
        </span>
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
          <Award className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-foreground text-3xl font-extrabold tracking-tight">
          {totalRewardsRedeemed}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          Récompenses distribuées
        </div>
      </div>
    </div>
  </div>
);
