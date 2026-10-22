import { ArrowRight, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SubscriptionDetails } from "@/dal/subscription";
import { cn } from "@/lib/utils";

interface QuotaBannerProps {
  subscriptionDetails?: SubscriptionDetails | null;
}

const getBadgeVariant = (
  isPro: boolean,
  isLimitReached: boolean,
  isNearLimit: boolean
): "accent" | "destructive" | "warning" | "brand" => {
  if (isPro) {
    return "accent";
  }
  if (isLimitReached) {
    return "destructive";
  }
  if (isNearLimit) {
    return "warning";
  }
  return "brand";
};

const getBadgeLabel = (isPro: boolean, status: string): string => {
  if (isPro) {
    return "Illimité";
  }
  if (status === "trial") {
    return "Essai gratuit";
  }
  return "Actif";
};

const getQuotaTextColor = (
  isLimitReached: boolean,
  isNearLimit: boolean
): string => {
  if (isLimitReached) {
    return "text-destructive";
  }
  if (isNearLimit) {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-foreground";
};

const getProgressBarColor = (
  isLimitReached: boolean,
  isNearLimit: boolean
): string => {
  if (isLimitReached) {
    return "bg-destructive";
  }
  if (isNearLimit) {
    return "bg-amber-500";
  }
  return "bg-primary";
};

export const QuotaBanner = ({ subscriptionDetails }: QuotaBannerProps) => {
  const plan = subscriptionDetails?.subscription?.plan ?? "starter";
  const status = subscriptionDetails?.subscription?.status ?? "trial";
  const customerCount = subscriptionDetails?.customerCount ?? 0;
  const maxFreeCustomers = subscriptionDetails?.maxFreeCustomers ?? 30;
  const isPro = plan === "pro";

  const percentage = isPro
    ? 100
    : Math.min(100, Math.round((customerCount / maxFreeCustomers) * 100));
  const isLimitReached = !isPro && customerCount >= maxFreeCustomers;
  const isNearLimit = !isPro && percentage >= 80;

  const badgeVariant = getBadgeVariant(isPro, isLimitReached, isNearLimit);
  const badgeLabel = getBadgeLabel(isPro, status);
  const quotaTextColor = getQuotaTextColor(isLimitReached, isNearLimit);
  const progressBarColor = getProgressBarColor(isLimitReached, isNearLimit);

  return (
    <div className="border-border bg-card relative overflow-hidden rounded-2xl border p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Plan status & Quota Progress */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              {isPro ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-foreground text-xs font-bold tracking-tight">
                  {isPro ? "Formule Pro" : "Formule Starter"}
                </span>
                <Badge size="sm" variant={badgeVariant}>
                  {badgeLabel}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {isPro
                  ? `${customerCount.toLocaleString("fr-FR")} clients inscrits sur votre programme`
                  : `${customerCount} / ${maxFreeCustomers} clients inscrits`}
              </p>
            </div>
          </div>

          {/* Progress bar (Starter only) */}
          {!isPro && (
            <div className="flex max-w-xs flex-1 flex-col gap-1.5 sm:max-w-[200px] lg:max-w-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">
                  Quota clients
                </span>
                <span className={cn("font-bold", quotaTextColor)}>
                  {percentage}%
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    progressBarColor
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Upgrade / Manage CTA */}
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/billing">
            <Button
              size="sm"
              variant={isLimitReached ? "default" : "outline"}
              className="gap-1.5 text-xs font-semibold"
            >
              <span>Gérer l&apos;abonnement</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
