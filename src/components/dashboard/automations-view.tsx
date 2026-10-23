"use client";

import {
  CheckCircle2,
  Compass,
  Loader2,
  MapPin,
  Moon,
  Save,
  Star,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { saveAutomationAction } from "@/app/actions/automation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type {
  AutomationsConfig,
  AutomationType,
  SaveAutomationInput,
} from "@/dal/automation";

interface AutomationsViewProps {
  initialConfig: AutomationsConfig;
}

export const AutomationsView = ({ initialConfig }: AutomationsViewProps) => {
  // Inactive Client state
  const [inactiveEnabled, setInactiveEnabled] = useState(
    initialConfig.inactiveClient.isEnabled
  );
  const [inactiveMessage, setInactiveMessage] = useState(
    initialConfig.inactiveClient.message
  );
  const [inactiveDays, setInactiveDays] = useState(
    initialConfig.inactiveClient.triggerValue
  );

  // Reward Proximity state
  const [rewardEnabled, setRewardEnabled] = useState(
    initialConfig.rewardProximity.isEnabled
  );
  const [rewardMessage, setRewardMessage] = useState(
    initialConfig.rewardProximity.message
  );
  const [rewardRemaining, setRewardRemaining] = useState(
    initialConfig.rewardProximity.triggerValue
  );

  // Location Proximity state
  const [locationEnabled, setLocationEnabled] = useState(
    initialConfig.locationProximity.isEnabled
  );
  const [locationMessage, setLocationMessage] = useState(
    initialConfig.locationProximity.message
  );
  const [locationAddress, setLocationAddress] = useState(
    initialConfig.locationProximity.address ?? ""
  );
  const locationCoordsRef = useRef<{
    latitude: string | null;
    longitude: string | null;
  }>({
    latitude: initialConfig.locationProximity.latitude ?? null,
    longitude: initialConfig.locationProximity.longitude ?? null,
  });

  const initialMapsUrl =
    initialConfig.locationProximity.placeId ||
    (initialConfig.locationProximity.latitude &&
    initialConfig.locationProximity.longitude
      ? `${initialConfig.locationProximity.latitude}, ${initialConfig.locationProximity.longitude}`
      : "");

  const [locationMapsUrl, setLocationMapsUrl] = useState(initialMapsUrl);
  const [locationDistance, setLocationDistance] = useState(
    initialConfig.locationProximity.triggerValue || 100
  );

  // Feedback & Loading states per card
  const [activeFeedback, setActiveFeedback] = useState<{
    text: string;
    type: AutomationType;
    variant: "error" | "success";
  } | null>(null);

  const [savingCard, setSavingCard] = useState<AutomationType | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isPending, startTransition] = useTransition();

  const getPayload = (cardType: AutomationType): SaveAutomationInput => {
    if (cardType === "inactive_client") {
      return {
        isEnabled: inactiveEnabled,
        message: inactiveMessage.trim(),
        triggerValue: Number(inactiveDays) || 30,
        type: "inactive_client",
      };
    }

    if (cardType === "reward_proximity") {
      return {
        isEnabled: rewardEnabled,
        message: rewardMessage.trim(),
        triggerValue: Number(rewardRemaining) || 20,
        type: "reward_proximity",
      };
    }

    return {
      address: locationAddress.trim() || null,
      isEnabled: locationEnabled,
      latitude: locationCoordsRef.current.latitude,
      longitude: locationCoordsRef.current.longitude,
      message: locationMessage.trim() || "Un café vous attend chez nous ☕",
      placeId: locationMapsUrl.trim() || null,
      triggerValue: Number(locationDistance) || 100,
      type: "location_proximity",
    };
  };

  const handleSaveCard = (type: AutomationType) => {
    setActiveFeedback(null);
    setSavingCard(type);

    const payload = getPayload(type);

    startTransition(async () => {
      const res = await saveAutomationAction(payload);
      setSavingCard(null);

      if (res.success) {
        setActiveFeedback({
          text: "Modifications enregistrées avec succès !",
          type,
          variant: "success",
        });
      } else {
        setActiveFeedback({
          text:
            res.error || "Une erreur est survenue lors de l'enregistrement.",
          type,
          variant: "error",
        });
      }
    });
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setActiveFeedback({
        text: "La géolocalisation n'est pas supportée par votre navigateur.",
        type: "location_proximity",
        variant: "error",
      });
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        locationCoordsRef.current = { latitude: lat, longitude: lng };
        setLocationMapsUrl(`${lat}, ${lng}`);
        setActiveFeedback({
          text: "Position GPS détectée avec succès !",
          type: "location_proximity",
          variant: "success",
        });
      },
      (err) => {
        setIsDetectingGps(false);
        setActiveFeedback({
          text: `Impossible d'accéder au GPS : ${err.message}`,
          type: "location_proximity",
          variant: "error",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
      }
    );
  };

  const renderButtonContent = (type: AutomationType) => {
    const isCurrentlySaving = isPending && savingCard === type;

    if (isCurrentlySaving) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Enregistrement...</span>
        </>
      );
    }

    return (
      <>
        <Save className="h-4 w-4" />
        <span>Enregistrer</span>
      </>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* 1. Header */}
      <div className="space-y-1">
        <Heading
          level={1}
          className="text-foreground text-3xl font-black tracking-tight uppercase sm:text-4xl"
        >
          AUTOMATISATIONS
        </Heading>
        <p className="text-muted-foreground text-sm">
          Des messages envoyés automatiquement pour faire revenir vos clients —
          sans effort de votre part.
        </p>
      </div>

      {/* 2. Automation Cards */}
      <div className="space-y-6">
        {/* CARD 1: Relance client inactif */}
        <Card className="border-border bg-card space-y-5 rounded-2xl border p-6 shadow-xs sm:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7c3aed] text-white shadow-xs">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-foreground text-base font-bold sm:text-lg">
                  Relance client inactif
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Recontacte automatiquement les clients qui ne sont pas
                  revenus.
                </p>
              </div>
            </div>

            <Switch
              id="switch-inactive-client"
              checked={inactiveEnabled}
              onCheckedChange={setInactiveEnabled}
              ariaLabel="Activer ou désactiver la relance client inactif"
            />
          </div>

          {/* Body */}
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label
                htmlFor="inactive-message"
                className="text-foreground text-xs font-semibold"
              >
                Message
              </label>
              <textarea
                id="inactive-message"
                rows={3}
                value={inactiveMessage}
                onChange={(e) => setInactiveMessage(e.target.value)}
                placeholder="Cela fait un moment ! Revenez profiter de vos avantages fidélité. 😊"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-foreground w-full resize-none rounded-xl border p-3.5 text-sm transition focus:ring-1 focus:outline-none"
              />
            </div>

            <div className="text-foreground flex flex-wrap items-center gap-2.5 text-sm">
              <label
                htmlFor="inactive-days"
                className="text-muted-foreground font-medium"
              >
                Après
              </label>
              <Input
                id="inactive-days"
                type="number"
                min={1}
                max={365}
                value={inactiveDays}
                onChange={(e) => setInactiveDays(Number(e.target.value))}
                className="h-10 w-20 rounded-xl text-center text-sm font-bold"
              />
              <span className="text-muted-foreground font-medium">
                jours sans visite
              </span>
            </div>

            {/* Feedback Message */}
            {activeFeedback?.type === "inactive_client" && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                  activeFeedback.variant === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{activeFeedback.text}</span>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => handleSaveCard("inactive_client")}
                disabled={isPending && savingCard === "inactive_client"}
                className="rounded-full bg-black px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {renderButtonContent("inactive_client")}
              </Button>
            </div>
          </div>
        </Card>

        {/* CARD 2: Bientôt une récompense */}
        <Card className="border-border bg-card space-y-5 rounded-2xl border p-6 shadow-xs sm:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-foreground text-base font-bold sm:text-lg">
                  Bientôt une récompense
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Une notification quand le client approche de sa récompense
                  (push).
                </p>
              </div>
            </div>

            <Switch
              id="switch-reward-proximity"
              checked={rewardEnabled}
              onCheckedChange={setRewardEnabled}
              ariaLabel="Activer ou désactiver l'alerte récompense proche"
            />
          </div>

          {/* Body */}
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label
                htmlFor="reward-message"
                className="text-foreground text-xs font-semibold"
              >
                Message
              </label>
              <textarea
                id="reward-message"
                rows={2}
                value={rewardMessage}
                onChange={(e) => setRewardMessage(e.target.value)}
                placeholder="Plus que quelques points pour débloquer votre récompense chez nous ! 🎁"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-foreground w-full resize-none rounded-xl border p-3.5 text-sm transition focus:ring-1 focus:outline-none"
              />
            </div>

            <div className="text-foreground flex flex-wrap items-center gap-2.5 text-sm">
              <label
                htmlFor="reward-remaining"
                className="text-muted-foreground font-medium"
              >
                Notifier quand il reste
              </label>
              <Input
                id="reward-remaining"
                type="number"
                min={1}
                max={1000}
                value={rewardRemaining}
                onChange={(e) => setRewardRemaining(Number(e.target.value))}
                className="h-10 w-20 rounded-xl text-center text-sm font-bold"
              />
              <span className="text-muted-foreground font-medium">
                points avant la récompense
              </span>
            </div>

            {/* Feedback Message */}
            {activeFeedback?.type === "reward_proximity" && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                  activeFeedback.variant === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{activeFeedback.text}</span>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => handleSaveCard("reward_proximity")}
                disabled={isPending && savingCard === "reward_proximity"}
                className="rounded-full bg-black px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {renderButtonContent("reward_proximity")}
              </Button>
            </div>
          </div>
        </Card>

        {/* CARD 3: Notification à proximité */}
        <Card className="border-border bg-card space-y-5 rounded-2xl border p-6 shadow-xs sm:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-foreground text-base font-bold sm:text-lg">
                  Notification à proximité
                </h2>
                <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                  Vos clients reçoivent une notification quand ils passent près
                  de chez vous, sans que vous ayez rien à envoyer. Il faut que
                  la carte soit dans leur wallet. Comptez quelques minutes après
                  leur entrée dans la zone : le téléphone n&apos;écoute pas le
                  GPS en continu, il se réveille par intermittence pour
                  préserver la batterie.
                </p>
              </div>
            </div>

            <Switch
              id="switch-location-proximity"
              checked={locationEnabled}
              onCheckedChange={setLocationEnabled}
              ariaLabel="Activer ou désactiver la notification à proximité"
            />
          </div>

          {/* Body */}
          <div className="space-y-5 pt-1">
            {/* 1. Emplacement de la boutique */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="location-maps-url"
                  className="text-foreground text-xs font-semibold"
                >
                  Emplacement de la boutique (lien Google Maps)
                </label>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDetectGps}
                  disabled={isDetectingGps}
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                >
                  {isDetectingGps ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Compass className="h-3.5 w-3.5" />
                  )}
                  <span>Détecter ma position actuelle</span>
                </Button>
              </div>

              <Input
                id="location-maps-url"
                type="text"
                value={locationMapsUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocationMapsUrl(val);
                  const directMatch = val
                    .replaceAll(/[()]/gu, "")
                    .match(/^(?<lat>-?\d+\.\d+)[,\s]+(?<lng>-?\d+\.\d+)$/u);
                  if (directMatch?.groups?.lat && directMatch.groups.lng) {
                    locationCoordsRef.current = {
                      latitude: directMatch.groups.lat,
                      longitude: directMatch.groups.lng,
                    };
                  }
                }}
                placeholder="Collez votre lien Google Maps"
                className="h-10 rounded-xl text-sm"
              />

              <p className="text-muted-foreground text-xs leading-relaxed">
                Sur Google Maps : trouvez votre boutique, appuyez sur{" "}
                <strong>Partager</strong>, puis copiez le lien. Vous pouvez
                aussi saisir vos coordonnées : 33.5731, -7.5898. Laissez vide
                pour désactiver.
              </p>
            </div>

            {/* 2. Adresse de votre établissement (without 'ex:') */}
            <div className="space-y-1.5">
              <label
                htmlFor="location-address"
                className="text-foreground text-xs font-semibold"
              >
                Adresse de votre établissement
              </label>
              <Input
                id="location-address"
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="12 Boulevard Mohammed V, Casablanca"
                className="h-10 rounded-xl text-sm"
              />
            </div>

            {/* 3. Distance de déclenchement & Message affiché */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Distance de déclenchement */}
              <div className="space-y-1.5">
                <label
                  htmlFor="location-distance"
                  className="text-foreground text-xs font-semibold"
                >
                  Distance de déclenchement
                </label>
                <Input
                  id="location-distance"
                  type="number"
                  min={50}
                  max={2000}
                  value={locationDistance}
                  onChange={(e) => setLocationDistance(Number(e.target.value))}
                  className="h-10 rounded-xl text-sm font-semibold"
                />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  En mètres, jusqu&apos;à 2000. Couverture réelle :{" "}
                  <strong>≈ 250 m</strong>. Apple et Google fixent eux-mêmes la
                  portée de chaque point ; nous en plaçons plusieurs autour de
                  votre boutique pour couvrir la zone, sans jamais pouvoir
                  dépasser ce plafond.
                </p>
              </div>

              {/* Message affiché */}
              <div className="space-y-1.5">
                <label
                  htmlFor="location-message"
                  className="text-foreground text-xs font-semibold"
                >
                  Message affiché
                </label>
                <Input
                  id="location-message"
                  type="text"
                  maxLength={120}
                  value={locationMessage}
                  onChange={(e) => setLocationMessage(e.target.value)}
                  placeholder="Un café vous attend chez nous ☕"
                  className="h-10 rounded-xl text-sm"
                />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  120 caractères maximum. Vide = « Vous êtes près de [votre
                  commerce] ».
                </p>
              </div>
            </div>

            {/* Feedback Message */}
            {activeFeedback?.type === "location_proximity" && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                  activeFeedback.variant === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{activeFeedback.text}</span>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => handleSaveCard("location_proximity")}
                disabled={isPending && savingCard === "location_proximity"}
                className="rounded-full bg-black px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {renderButtonContent("location_proximity")}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Footer Muted Note (as in mockup) */}
      <p className="text-muted-foreground text-center text-xs">
        Les envois sont vérifiés chaque jour. Un même client n&apos;est jamais
        contacté deux fois pour le même déclencheur.
      </p>
    </div>
  );
};
