"use client";

import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Send,
  Shield,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";

import { sendManualNotificationAction } from "@/app/actions/notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import type {
  BroadcastAudienceStats,
  NotificationItem,
} from "@/dal/notification";

interface NotificationsViewProps {
  businessLogo?: string | null;
  businessName: string;
  initialHistory: NotificationItem[];
  initialStats: BroadcastAudienceStats;
}

export const NotificationsView = ({
  businessLogo,
  businessName,
  initialHistory,
  initialStats,
}: NotificationsViewProps) => {
  const [history, setHistory] = useState<NotificationItem[]>(initialHistory);
  const [stats, setStats] = useState<BroadcastAudienceStats>(initialStats);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const isQuotaReached = stats.usedToday >= 3;

  const renderSubmitButtonContent = () => {
    if (isPending) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Envoi en cours...</span>
        </>
      );
    }
    if (isQuotaReached) {
      return <span>Quota atteint (3/3 aujourd&apos;hui)</span>;
    }
    return (
      <>
        <Send className="h-4 w-4" />
        <span>Envoyer la notification</span>
      </>
    );
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      setFeedback({
        text: "Veuillez renseigner un titre et un message.",
        type: "error",
      });
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const res = await sendManualNotificationAction({
        actionUrl: actionUrl.trim() || undefined,
        message: message.trim(),
        title: title.trim(),
      });

      const newNotification = res.notification;
      if (res.success && newNotification) {
        setHistory((prev) => [newNotification, ...prev]);
        setStats((prev) => ({
          ...prev,
          remainingToday: Math.max(0, prev.remainingToday - 1),
          usedToday: prev.usedToday + 1,
        }));
        setTitle("");
        setMessage("");
        setActionUrl("");
        setFeedback({
          text: "Notification push envoyée avec succès à tous vos clients Wallet !",
          type: "success",
        });
      } else {
        setFeedback({
          text: res.error || "Erreur lors de l'envoi de la notification.",
          type: "error",
        });
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* 1. Header matching Fidelix Design System */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Heading
            level={1}
            className="text-foreground text-3xl font-black tracking-tight uppercase sm:text-4xl"
          >
            NOTIFICATIONS
          </Heading>
          <span className="rounded-full bg-[#ef4444] px-3 py-0.5 text-xs font-bold text-white shadow-xs">
            Push
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Envoyez des notifications push à vos clients inscrits
        </p>
      </div>

      {/* 2. Main Content Grid: Form (Left) + Phone Preview (Right) */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Form Card */}
        <div className="lg:col-span-7 xl:col-span-8">
          <Card className="border-border bg-card rounded-2xl border p-6 shadow-xs sm:p-7">
            {/* Card Header */}
            <div className="border-border/60 flex items-start justify-between gap-4 border-b pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#ef4444]" />
                  <h2 className="text-foreground text-base font-bold sm:text-lg">
                    Nouvelle notification
                  </h2>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Jusqu&apos;à 3 notifications par jour. Au-delà, les clients se
                  lassent et suppriment leur carte.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-[#ef4444] dark:bg-red-500/20">
                {stats.usedToday}/3 aujourd&apos;hui
              </span>
            </div>

            {/* Form Fields */}
            <div className="mt-6 space-y-5">
              {/* Titre */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="notification-title"
                    className="text-foreground text-xs font-bold"
                  >
                    Titre
                  </label>
                  <span
                    className={`font-mono text-xs ${
                      title.length > 50
                        ? "text-destructive font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {title.length}/50
                  </span>
                </div>
                <Input
                  id="notification-title"
                  maxLength={50}
                  placeholder="Ex : Offre spéciale ce weekend !"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending || isQuotaReached}
                  className="border-border bg-background rounded-xl text-sm"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="notification-message"
                    className="text-foreground text-xs font-bold"
                  >
                    Message
                  </label>
                  <span
                    className={`font-mono text-xs ${
                      message.length > 150
                        ? "text-destructive font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.length}/150
                  </span>
                </div>
                <textarea
                  id="notification-message"
                  rows={4}
                  maxLength={150}
                  placeholder="Profitez de -20% sur votre prochaine visite. Valable jusqu'au 30 juin."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isPending || isQuotaReached}
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Lien optionnel */}
              <div className="space-y-1.5">
                <label
                  htmlFor="notification-url"
                  className="text-foreground text-xs font-bold"
                >
                  Lien optionnel (bouton dans la notif)
                </label>
                <Input
                  id="notification-url"
                  placeholder="https://votre-site.ma/offre"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  disabled={isPending || isQuotaReached}
                  className="border-border bg-background rounded-xl text-sm"
                />
              </div>

              {/* Moderation Alert Box */}
              <div className="border-border bg-muted/40 text-muted-foreground dark:bg-muted/20 flex items-start gap-3 rounded-xl border p-3.5 text-xs leading-relaxed">
                <Shield className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Les notifications sont modérées automatiquement. Tout contenu
                  inapproprié (injures, contenu sexuel, texte non professionnel)
                  sera bloqué et non publié.
                </span>
              </div>

              {/* Feedback status */}
              {feedback && (
                <div
                  className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-medium ${
                    feedback.type === "success"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-destructive/20 bg-destructive/10 text-destructive"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{feedback.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="button"
                onClick={handleSend}
                disabled={
                  isPending ||
                  isQuotaReached ||
                  !title.trim() ||
                  !message.trim() ||
                  title.length > 50 ||
                  message.length > 150
                }
                className="h-11 w-full rounded-xl bg-[#ef4444] text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#dc2626] disabled:opacity-50"
              >
                {renderSubmitButtonContent()}
              </Button>
            </div>
          </Card>
        </div>

        {/* Live Smartphone Preview (Right) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Smartphone className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Aperçu en direct
              </span>
            </div>

            {/* Clean Mobile Frame without unneeded clock/status clutter */}
            <div className="border-border/80 bg-card relative mx-auto w-full max-w-[320px] rounded-[32px] border-4 p-4 shadow-xl">
              {/* Top Notch pill */}
              <div className="bg-muted/60 mx-auto mb-4 h-3.5 w-20 rounded-full" />

              {/* Google Wallet Push Notification Card */}
              <div className="border-border/70 bg-background/95 rounded-2xl border p-3.5 shadow-sm transition-all">
                {/* Header: Logo + Business Name + Time */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full">
                      {businessLogo ? (
                        <Image
                          src={businessLogo}
                          alt="Logo"
                          width={20}
                          height={20}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-primary text-[10px] font-bold">
                          {businessName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-foreground max-w-[150px] truncate text-[11px] font-semibold">
                      {businessName}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-[10px]">
                    À l&apos;instant
                  </span>
                </div>

                {/* Title */}
                <div className="text-foreground text-xs font-bold">
                  {title.trim() || "Ex : Offre spéciale ce weekend !"}
                </div>

                {/* Message Body */}
                <div className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                  {message.trim() ||
                    "Profitez de -20% sur votre prochaine visite. Valable jusqu'au 30 juin."}
                </div>

                {/* Action Link button preview if provided */}
                {actionUrl.trim() && (
                  <div className="border-border/80 bg-muted/30 text-foreground mt-2.5 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-medium">
                    <ExternalLink className="text-muted-foreground h-3 w-3 shrink-0" />
                    <span className="truncate">{actionUrl}</span>
                  </div>
                )}
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="bg-muted/60 mx-auto mt-6 h-1 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Historique des notifications (Card 2) */}
      <Card className="border-border bg-card rounded-2xl border p-6 shadow-xs sm:p-7">
        <h3 className="text-foreground text-base font-bold sm:text-lg">
          Historique des notifications
        </h3>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="text-muted-foreground/30 h-10 w-10 stroke-[1.5]" />
            <p className="text-muted-foreground mt-3 text-sm font-medium">
              Aucune notification envoyée
            </p>
          </div>
        ) : (
          <div className="border-border mt-5 overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-border bg-muted/40 text-muted-foreground border-b text-xs font-medium">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Titre</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Destinataires</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-border text-foreground divide-y">
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                        {new Date(item.sentAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold sm:text-sm">
                        {item.title}
                        {item.actionUrl && (
                          <a
                            href={item.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground ml-1.5 inline-flex"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </td>
                      <td className="text-muted-foreground max-w-md px-4 py-3 text-xs">
                        {item.message}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className="font-semibold">
                          {item.recipientCount}
                        </span>{" "}
                        <span className="text-muted-foreground">clients</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant="success"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Délivré
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
