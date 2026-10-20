"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Info,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  Radio,
  Shield,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

import {
  adminSetSubscriptionStatusAction,
  requestSubscriptionAction,
} from "@/app/actions/subscription";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  SubscriptionDetails,
  SubscriptionInfo,
  SubscriptionStatus,
} from "@/dal/subscription";
import { cn } from "@/lib/utils";

interface BillingViewProps {
  initialDetails: SubscriptionDetails;
}

// Configurable pricing in Algerian Dinars (DZD)
const STARTER_MONTHLY_PRICE = 2900;
const PRO_MONTHLY_PRICE = 4900;
const EXTRA_STORE_MONTHLY_PRICE = 2500;
const NFC_PLAQUE_PRICE = 2500;
// Official platform WhatsApp phone number
const WHATSAPP_CONTACT_PHONE = "213796841801";

const handleScrollToPlans = () => {
  const el = document.querySelector("#plans-section");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
};

const getCycleLabel = (cycle: "mensuel" | "semestriel" | "annuel"): string => {
  if (cycle === "mensuel") {
    return "Mensuel (1 mois)";
  }
  if (cycle === "semestriel") {
    return "6 mois (1 mois offert)";
  }
  return "12 mois (2 mois offerts)";
};

const getCycleDescription = (
  cycle: "mensuel" | "semestriel" | "annuel"
): string => {
  if (cycle === "mensuel") {
    return "1 mois d'abonnement";
  }
  if (cycle === "semestriel") {
    return "6 mois d'abonnement (dont 1 mois offert)";
  }
  return "12 mois d'abonnement (dont 2 mois offerts)";
};

const getStatusTitle = (isActive: boolean, isPending: boolean): string => {
  if (isActive) {
    return "Formule Professionnelle Activée";
  }
  if (isPending) {
    return "Souscription en attente de paiement";
  }
  return "Aucun abonnement payant actif";
};

export const BillingView = ({ initialDetails }: BillingViewProps) => {
  const [details, setDetails] = useState<SubscriptionDetails>(initialDetails);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro">(
    details.subscription.plan || "pro"
  );
  const [billingCycle, setBillingCycle] = useState<
    "mensuel" | "semestriel" | "annuel"
  >(details.subscription.billingCycle || "mensuel");
  const [pointsOfSale, setPointsOfSale] = useState<number>(
    selectedPlan === "starter" ? 1 : details.subscription.pointsOfSale || 1
  );
  const [hasNfcPlaque, setHasNfcPlaque] = useState<boolean>(
    details.subscription.hasNfcPlaque || false
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingAdmin, setIsTogglingAdmin] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<
    string | null
  >(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore
    }
  };

  // Switch plan and reset points of sale if starter
  const handleSelectPlan = (plan: "starter" | "pro") => {
    setSelectedPlan(plan);
    if (plan === "starter") {
      setPointsOfSale(1);
    }
  };

  // Price calculations
  let multiplierMonths = 1;
  let monthsDiscounted = 0;
  if (billingCycle === "semestriel") {
    multiplierMonths = 6;
    // 1 month free (pay for 5 months)
    monthsDiscounted = 1;
  } else if (billingCycle === "annuel") {
    multiplierMonths = 12;
    // 2 months free (pay for 10 months)
    monthsDiscounted = 2;
  }

  const billableMonths = multiplierMonths - monthsDiscounted;

  // Monthly base price depending on plan and extra stores
  const baseMonthlyPrice =
    selectedPlan === "starter"
      ? STARTER_MONTHLY_PRICE
      : PRO_MONTHLY_PRICE + (pointsOfSale - 1) * EXTRA_STORE_MONTHLY_PRICE;

  const subscriptionTotal = baseMonthlyPrice * billableMonths;
  const grandTotal = subscriptionTotal + (hasNfcPlaque ? NFC_PLAQUE_PRICE : 0);

  const currentStatus = details.subscription.status;
  const isPending = currentStatus === "pending";
  const isActive = currentStatus === "active";

  const customerPercent = Math.min(
    100,
    Math.round((details.customerCount / details.maxFreeCustomers) * 100)
  );

  // Build WhatsApp prefilled message URL
  const getWhatsAppUrl = () => {
    const planName =
      selectedPlan === "starter"
        ? "Formule Débutant (200 clients max)"
        : "Formule Pro (Clients illimités)";
    const cycleLabel = getCycleLabel(billingCycle);
    const nfcText = hasNfcPlaque
      ? "Oui (avec plaque NFC acrylique +2 500 DA)"
      : "Non (sans plaque NFC)";

    const text = encodeURIComponent(
      `Bonjour Walaa 👋,\n\nJe souhaite activer l'abonnement pour mon établissement *${details.organizationName}*.\n\n` +
        `• Formule : *${planName}*\n` +
        `• Période : *${cycleLabel}*\n` +
        `• Points de vente : *${pointsOfSale}*\n` +
        `• Option Plaque NFC : *${nfcText}*\n` +
        `• Montant total : *${grandTotal.toLocaleString("fr-FR")} DA*\n\n` +
        `Pouvez-vous me transmettre les coordonnées BaridiMob / CCP / Virement pour valider mon compte ? Merci !`
    );

    return `https://wa.me/${WHATSAPP_CONTACT_PHONE}?text=${text}`;
  };

  // Handle Request Subscription
  const handleRequestSubscription = async () => {
    setIsSubmitting(true);
    setActionSuccessMessage(null);

    const res = await requestSubscriptionAction({
      billingCycle,
      hasNfcPlaque,
      plan: selectedPlan,
      pointsOfSale,
      price: grandTotal,
    });

    if (res.success && res.subscription) {
      setDetails((prev) => ({
        ...prev,
        subscription: res.subscription as SubscriptionInfo,
      }));
      setActionSuccessMessage(
        "Votre demande a bien été enregistrée ! Redirection vers WhatsApp pour valider le règlement..."
      );

      // Open WhatsApp in new tab
      window.open(getWhatsAppUrl(), "_blank");
    }

    setIsSubmitting(false);
  };

  // Admin Quick Switch (For testing / platform owner)
  const handleAdminToggle = async (
    targetStatus: SubscriptionStatus,
    months = 1
  ) => {
    setIsTogglingAdmin(true);
    const res = await adminSetSubscriptionStatusAction(targetStatus, months);
    if (res.success) {
      setDetails((prev) => ({
        ...prev,
        subscription: {
          ...prev.subscription,
          activatedAt:
            targetStatus === "active" ? new Date().toISOString() : null,
          expiresAt:
            targetStatus === "active"
              ? new Date(
                  Date.now() + months * 30 * 24 * 60 * 60 * 1000
                ).toISOString()
              : null,
          graceUntil:
            targetStatus === "grace"
              ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
              : null,
          status: targetStatus,
        },
      }));
    }
    setIsTogglingAdmin(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* 1. OFFRE GRATUITE Top Banner (30 clients) */}
      <Card className="border-border bg-card overflow-hidden rounded-2xl shadow-xs">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[11px] font-black tracking-wider uppercase">
                  Offre d&apos;essai gratuite
                </span>
                {details.customerCount >= details.maxFreeCustomers ? (
                  <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-[10px] font-bold">
                    Limite de 30 clients atteinte
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Actif
                  </span>
                )}
              </div>

              {/* Progress Bar & Counter */}
              <div className="flex items-center gap-3">
                <div className="bg-muted h-3 w-full max-w-xs overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      details.customerCount >= details.maxFreeCustomers
                        ? "bg-destructive"
                        : "bg-foreground"
                    )}
                    style={{ width: `${customerPercent}%` }}
                  />
                </div>
                <span className="text-foreground font-mono text-sm font-black">
                  {details.customerCount} / {details.maxFreeCustomers} clients
                </span>
              </div>

              <p className="text-muted-foreground text-xs">
                Gratuit jusqu&apos;à {details.maxFreeCustomers} clients pour
                tester et voir vos premiers clients revenir.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleScrollToPlans}
              className="border-border hover:bg-muted self-start rounded-xl text-xs font-semibold shadow-xs sm:self-auto"
            >
              <span>Voir les formules</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* NFC Plate alert notification */}
          <div className="border-border bg-muted/40 text-muted-foreground mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed">
            <Radio className="text-foreground mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span className="text-foreground font-semibold">
                La plaque NFC n&apos;est pas comprise dans l&apos;offre
                gratuite.
              </span>{" "}
              Elle se commande à part (
              {NFC_PLAQUE_PRICE.toLocaleString("fr-FR")} DA une seule fois).
              Sans elle, vos clients s&apos;inscrivent avec votre QR code
              imprimé.
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Status Callouts */}
      {currentStatus === "prepaid" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-900 shadow-xs dark:text-emerald-200">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">
                  Abonnement Prépayé Validé !
                </h3>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Départ automatique à la 30ème carte
                </span>
              </div>
              <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                Votre règlement pour la formule{" "}
                <strong>
                  {details.subscription.prepaidPlan?.plan === "pro"
                    ? "Pro"
                    : "Débutant"}
                </strong>{" "}
                a bien été validé par l&apos;équipe Walaa. Votre période payée
                ne sera pas décomptée tant que vous n&apos;avez pas atteint vos
                30 cartes fidélité gratuites (actuellement{" "}
                <strong>
                  {details.customerCount} / {details.maxFreeCustomers} cartes
                </strong>
                ).
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStatus === "grace" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-900 shadow-xs dark:text-amber-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">
                    Période de grâce en cours
                  </h3>
                  <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {details.graceDaysRemaining ?? 3} jour
                    {(details.graceDaysRemaining ?? 3) > 1 ? "s" : ""} restant
                    {(details.graceDaysRemaining ?? 3) > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                  Votre quota de cartes d&apos;essai ou votre abonnement est
                  arrivé à échéance. Vos caisses restent opérationnelles
                  temporairement afin de ne pas bloquer vos encaissements.
                  Veuillez régulariser votre abonnement pour continuer sans
                  interruption.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleScrollToPlans}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-amber-700"
            >
              <span>Régulariser maintenant</span>
            </Button>
          </div>
        </div>
      )}

      {currentStatus === "expired" && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">
                    Abonnement Suspendu (Scans caisse bloqués)
                  </h3>
                </div>
                <p className="mt-0.5 text-xs">
                  La période de grâce est expirée. L&apos;enregistrement de
                  nouveaux clients et les scans sont suspendus. Vos données
                  clients restent 100% conservées. Choisissez une formule
                  ci-dessous et envoyez votre reçu pour réactiver immédiatement.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleScrollToPlans}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition-colors"
            >
              <span>Réactiver mon compte</span>
            </Button>
          </div>
        </div>
      )}

      {isPending && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-5 text-sky-900 shadow-xs dark:text-sky-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
              <div>
                <h3 className="text-sm font-bold">
                  Demande d&apos;abonnement en attente de validation
                </h3>
                <p className="mt-0.5 text-xs text-sky-800 dark:text-sky-300">
                  Votre demande pour la formule{" "}
                  <strong>
                    {details.subscription.plan === "starter"
                      ? "Débutant"
                      : "Pro"}
                  </strong>{" "}
                  ({details.subscription.price.toLocaleString("fr-FR")} DA) est
                  enregistrée. Envoyez votre reçu BaridiMob sur WhatsApp au{" "}
                  <strong>0796841801</strong> pour activer immédiatement votre
                  compte.
                </p>
              </div>
            </div>

            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Envoyer le reçu sur WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {isActive && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-900 shadow-xs dark:text-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">Abonnement Actif</h3>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {details.subscription.plan === "starter"
                    ? "Formule Débutant (200 clients max)"
                    : "Formule Pro (Clients illimités)"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                Votre établissement bénéficie des fonctionnalités souscrites.
                {details.subscription.expiresAt && (
                  <span>
                    {" "}
                    Renouvellement prévu le{" "}
                    <strong>
                      {new Date(
                        details.subscription.expiresAt
                      ).toLocaleDateString("fr-FR")}
                    </strong>
                    .
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {actionSuccessMessage}
        </div>
      )}

      {/* 3. Main Configurator Card: "VOTRE ABONNEMENT" */}
      <div id="plans-section" className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-foreground text-2xl font-black tracking-tight uppercase sm:text-3xl">
            Votre abonnement
          </h2>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Choisissez la formule qui convient à la taille de votre
            établissement.
          </p>
        </div>

        {/* Plan Switcher Grid: Débutant vs Pro */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card 1: Débutant */}
          <button
            type="button"
            onClick={() => handleSelectPlan("starter")}
            className={cn(
              "relative flex flex-col justify-between rounded-2xl border p-6 text-left transition-all",
              selectedPlan === "starter"
                ? "border-foreground bg-card ring-foreground/20 shadow-md ring-2"
                : "border-border bg-card/60 hover:bg-card hover:border-foreground/40 shadow-xs"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-foreground text-base font-black tracking-wide uppercase">
                  Débutant
                </span>
                {selectedPlan === "starter" && (
                  <span className="bg-foreground text-background rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    Sélectionné
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-foreground font-mono text-3xl font-black">
                  {STARTER_MONTHLY_PRICE.toLocaleString("fr-FR")} DA
                </span>
                <span className="text-muted-foreground text-xs font-semibold">
                  / mois
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Idéal pour les commerces indépendants avec 1 seule caisse.
              </p>

              {/* Features list */}
              <div className="border-border mt-4 space-y-2 border-t pt-4 text-xs">
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Jusqu&apos;à <strong>200 clients</strong> enregistrés
                  </span>
                </div>
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Zap className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Programme à Tampons ou Système de Points</span>
                </div>
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Collecte et bonus Avis Google inclus</span>
                </div>
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Store className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span>1 seul scanner caisse (smartphone gérant)</span>
                </div>
              </div>
            </div>

            <div className="text-muted-foreground mt-6 text-[11px]">
              Sans caisses employés multiples
            </div>
          </button>

          {/* Card 2: Pro (Recommandé) */}
          <button
            type="button"
            onClick={() => handleSelectPlan("pro")}
            className={cn(
              "relative flex flex-col justify-between rounded-2xl border p-6 text-left transition-all",
              selectedPlan === "pro"
                ? "border-foreground bg-card ring-foreground/20 shadow-md ring-2"
                : "border-border bg-card/60 hover:bg-card hover:border-foreground/40 shadow-xs"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-base font-black tracking-wide uppercase">
                    Pro
                  </span>
                  <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-400">
                    Recommandé
                  </span>
                </div>
                {selectedPlan === "pro" && (
                  <span className="bg-foreground text-background rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    Sélectionné
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-foreground font-mono text-3xl font-black">
                  {PRO_MONTHLY_PRICE.toLocaleString("fr-FR")} DA
                </span>
                <span className="text-muted-foreground text-xs font-semibold">
                  / mois
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                La solution complète pour les équipes et les commerces établis.
              </p>

              {/* Features list */}
              <div className="border-border mt-4 space-y-2 border-t pt-4 text-xs">
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    <strong>Clients 100% ILLIMITÉS</strong>
                  </span>
                </div>
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Store className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>
                    <strong>Caisses employé illimitées</strong> avec code &amp;
                    classement
                  </span>
                </div>
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Shield className="h-4 w-4 shrink-0 text-blue-500" />
                  <span>
                    <strong>Espace Responsables</strong> pour déléguer la
                    gestion
                  </span>
                </div>
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Zap className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Tampons, Points par palier &amp; Avis Google</span>
                </div>
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Store className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span>Multi-boutiques possible (+2 500 DA / boutique)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Support prioritaire WhatsApp 7j/7
            </div>
          </button>
        </div>

        {/* Configuration Card: Billing Cycle, Multi-Store & NFC */}
        <Card className="border-border bg-card rounded-2xl p-6 shadow-xs sm:p-8">
          <div className="space-y-6">
            <div>
              <div className="text-muted-foreground text-[11px] font-black tracking-widest uppercase">
                Durée d&apos;abonnement
              </div>
              <div className="border-border bg-muted/50 mt-2 grid grid-cols-3 gap-1 rounded-2xl border p-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBillingCycle("mensuel")}
                  className={cn(
                    "rounded-xl py-2.5 text-center transition-all",
                    billingCycle === "mensuel"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Mensuel
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle("semestriel")}
                  className={cn(
                    "relative rounded-xl py-2.5 text-center transition-all",
                    billingCycle === "semestriel"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>6 mois</span>{" "}
                  <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">
                    -1 mois
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle("annuel")}
                  className={cn(
                    "relative rounded-xl py-2.5 text-center transition-all",
                    billingCycle === "annuel"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>12 mois</span>{" "}
                  <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">
                    -2 mois
                  </span>
                </button>
              </div>
            </div>

            {/* Multi-Store Section (for Pro Plan) */}
            {selectedPlan === "pro" && (
              <div className="border-border space-y-3 border-t pt-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Store className="text-muted-foreground h-4 w-4" />
                    <span>
                      {pointsOfSale} boutique{pointsOfSale > 1 ? "s" : ""}{" "}
                      (Points de vente)
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {pointsOfSale === 1
                      ? "1 boutique incluse"
                      : `1 boutique + ${pointsOfSale - 1} extra (+${((pointsOfSale - 1) * EXTRA_STORE_MONTHLY_PRICE).toLocaleString("fr-FR")} DA/mois)`}
                  </span>
                </div>

                {/* Counter */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pointsOfSale <= 1}
                    onClick={() =>
                      setPointsOfSale(Math.max(1, pointsOfSale - 1))
                    }
                    className="h-9 rounded-xl"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-[40px] text-center font-mono text-sm font-bold">
                    {pointsOfSale}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPointsOfSale(pointsOfSale + 1)}
                    className="h-9 rounded-xl"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    <span>Ajouter une boutique (+2 500 DA/m)</span>
                  </Button>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Chaque boutique dispose de ses propres adresses, caisses et
                  statistiques, tout en partageant une carte de fidélité unifiée
                  pour vos clients.
                </p>
              </div>
            )}

            {/* Plaque NFC Option Checkbox */}
            <button
              type="button"
              onClick={() => setHasNfcPlaque(!hasNfcPlaque)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition-all",
                hasNfcPlaque
                  ? "border-foreground bg-muted/40 ring-foreground/20 ring-1"
                  : "border-border bg-card hover:bg-muted/40"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border transition-all",
                    hasNfcPlaque
                      ? "border-foreground bg-foreground text-background"
                      : "border-muted-foreground/30 bg-background"
                  )}
                >
                  {hasNfcPlaque && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-foreground text-xs font-bold">
                    Ajouter la plaque NFC acrylique de comptoir
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    Pose immédiate en caisse : vos clients approchent leur
                    smartphone pour s&apos;inscrire.
                  </div>
                </div>
              </div>

              <span className="text-foreground shrink-0 font-mono text-xs font-bold">
                +{NFC_PLAQUE_PRICE.toLocaleString("fr-FR")} DA
              </span>
            </button>

            {/* Total Recap & Action Button */}
            <div className="border-border space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-foreground text-sm font-black">
                    Montant total à régler
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Formule{" "}
                    <strong>
                      {selectedPlan === "starter" ? "Débutant" : "Pro"}
                    </strong>{" "}
                    &bull; {getCycleDescription(billingCycle)}
                    {hasNfcPlaque && " + Plaque NFC"}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xl font-black text-rose-600 sm:text-2xl dark:text-rose-400">
                    {grandTotal.toLocaleString("fr-FR")} DA
                  </div>
                </div>
              </div>

              {/* Call to Action: Activer via WhatsApp */}
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleRequestSubscription}
                className="bg-foreground text-background hover:bg-foreground/90 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    <span>
                      {isPending
                        ? `Mettre à jour la formule — ${grandTotal.toLocaleString("fr-FR")} DA`
                        : `Activer la formule ${selectedPlan === "starter" ? "Débutant" : "Pro"} — ${grandTotal.toLocaleString("fr-FR")} DA`}
                    </span>
                  </>
                )}
              </Button>

              <p className="text-muted-foreground text-center text-[11px]">
                Paiement manuel sécurisé par BaridiMob, virement bancaire ou
                CCP. Activation immédiate après confirmation.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Coordonnées de règlement BaridiMob & CCP */}
      <Card className="border-border bg-card rounded-2xl p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground text-sm font-bold">
                Coordonnées de règlement BaridiMob &amp; CCP
              </h3>
              <p className="text-muted-foreground text-xs">
                Effectuez votre virement BaridiMob ou versement CCP, puis
                envoyez le reçu sur WhatsApp au <strong>0796841801</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* BaridiMob RIP */}
            <div className="border-border bg-muted/40 flex flex-col justify-between rounded-xl border p-3">
              <span className="text-muted-foreground text-[10px] font-bold uppercase">
                BaridiMob RIP (20 chiffres)
              </span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="text-foreground font-mono text-xs font-bold sm:text-sm">
                  00799999000000000000
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("00799999000000000000", "rip")}
                  className="h-7 rounded-lg px-2 text-[11px]"
                >
                  {copiedField === "rip" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1">
                    {copiedField === "rip" ? "Copié !" : "Copier"}
                  </span>
                </Button>
              </div>
            </div>

            {/* CCP Account */}
            <div className="border-border bg-muted/40 flex flex-col justify-between rounded-xl border p-3">
              <span className="text-muted-foreground text-[10px] font-bold uppercase">
                Compte CCP
              </span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="text-foreground font-mono text-xs font-bold sm:text-sm">
                  0021345678 Clé 90
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("002134567890", "ccp")}
                  className="h-7 rounded-lg px-2 text-[11px]"
                >
                  {copiedField === "ccp" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1">
                    {copiedField === "ccp" ? "Copié !" : "Copier"}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          <div className="border-border flex flex-col gap-2 border-t pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground text-[11px]">
              Titulaire : <strong>Walaa Loyalty Platform</strong> &bull; Contact
              assistance : <strong>0796841801</strong>
            </span>
            <a
              href={`https://wa.me/${WHATSAPP_CONTACT_PHONE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Ouvrir WhatsApp (+213 796 841 801)</span>
            </a>
          </div>
        </div>
      </Card>

      {/* 5. Full Plan Description Card (matching Fidelix bottom card) */}
      <div className="space-y-4">
        <Card className="border-border bg-card rounded-2xl p-6 text-center shadow-xs sm:p-8">
          <div className="bg-muted text-foreground mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
            <CreditCard className="h-6 w-6" />
          </div>

          <h3 className="text-foreground mt-4 text-base font-bold">
            {getStatusTitle(isActive, isPending)}
          </h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-xs">
            {isActive
              ? `Votre établissement bénéficie de la formule ${details.subscription.plan === "starter" ? "Débutant (200 clients max)" : "Pro (clients illimités)"}.`
              : "Souscrivez à un plan pour activer votre programme de fidélité et inscrire vos clients sans interruption."}
          </p>

          <div className="mt-6">
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:underline dark:text-rose-400"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Contactez-nous sur WhatsApp pour toute question</span>
            </a>
          </div>
        </Card>
      </div>

      {/* 6. Owner / Dev Quick Switcher (Discreet testing helper for user) */}
      <div className="border-border bg-muted/20 rounded-2xl border border-dashed p-4 text-xs">
        <div className="text-muted-foreground flex items-center gap-2 font-semibold">
          <Info className="h-4 w-4" />
          <span>Contrôle administrateur (Simuler l&apos;activation) :</span>
        </div>
        <p className="text-muted-foreground mt-1 text-[11px]">
          En tant que propriétaire, vous pouvez tester les différents états de
          l&apos;application avant la création de votre espace super-admin
          dédié.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTogglingAdmin}
            onClick={() => handleAdminToggle("active", 1)}
            className="rounded-xl text-xs font-semibold"
          >
            {isTogglingAdmin ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Passer en Actif (1 mois)"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTogglingAdmin}
            onClick={() => handleAdminToggle("active", 12)}
            className="rounded-xl text-xs font-semibold"
          >
            {isTogglingAdmin ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Passer en Actif (1 an)"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTogglingAdmin}
            onClick={() => handleAdminToggle("prepaid")}
            className="rounded-xl text-xs font-semibold"
          >
            {isTogglingAdmin ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Simuler Prépayé"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTogglingAdmin}
            onClick={() => handleAdminToggle("grace")}
            className="rounded-xl text-xs font-semibold"
          >
            {isTogglingAdmin ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Simuler Grâce (3 jours)"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTogglingAdmin}
            onClick={() => handleAdminToggle("expired")}
            className="rounded-xl text-xs font-semibold"
          >
            {isTogglingAdmin ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Simuler Expiré"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTogglingAdmin}
            onClick={() => handleAdminToggle("trial")}
            className="rounded-xl text-xs font-semibold"
          >
            {isTogglingAdmin ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Remettre en Essai gratuit (< 30)"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
