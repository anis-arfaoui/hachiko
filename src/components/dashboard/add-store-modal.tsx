"use client";

import { Check, CreditCard, Loader2, Plus, Send, Store, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import {
  createLocationAction,
  requestExtraLocationAction,
} from "@/app/actions/location";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LocationItem } from "@/dal/location";

interface AddStoreModalProps {
  allowedCount: number;
  currentCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLoc: LocationItem) => void;
  planName?: string;
}

export const AddStoreModal = ({
  allowedCount,
  currentCount,
  isOpen,
  onClose,
  onSuccess,
  planName = "Starter",
}: AddStoreModalProps) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    whatsAppUrl?: string;
  } | null>(null);

  if (!isOpen) {
    return null;
  }

  const isQuotaReached = currentCount >= allowedCount;

  const renderSubmitButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Traitement...</span>
        </>
      );
    }
    if (isQuotaReached) {
      return (
        <>
          <Send className="h-3.5 w-3.5" />
          <span>Commander via BaridiMob (+2 500 DA)</span>
        </>
      );
    }
    return (
      <>
        <Plus className="h-3.5 w-3.5" />
        <span>Créer la boutique</span>
      </>
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg(
        "Le nom de la boutique doit comporter au moins 2 caractères."
      );
      return;
    }

    setIsLoading(true);

    try {
      if (isQuotaReached) {
        // Over quota: create as pending and trigger WhatsApp payment request
        const res = await requestExtraLocationAction({
          address,
          city,
          name: trimmedName,
          phone,
        });

        if (res.success && res.location) {
          setSuccessInfo({
            message:
              "Votre nouvelle boutique a été enregistrée en attente d'activation. Redirection vers WhatsApp pour régler via BaridiMob...",
            whatsAppUrl: res.whatsAppUrl,
          });

          if (res.whatsAppUrl) {
            window.open(res.whatsAppUrl, "_blank");
          }

          onSuccess(res.location);
        } else {
          setErrorMsg(
            res.error || "Impossible d'enregistrer la demande de boutique."
          );
        }
      } else {
        // Within quota: create immediately
        const res = await createLocationAction({
          address,
          city,
          name: trimmedName,
          phone,
        });

        if (res.success && res.location) {
          onSuccess(res.location);
          onClose();
        } else {
          setErrorMsg(
            res.error || "Une erreur est survenue lors de la création."
          );
        }
      }
    } catch {
      setErrorMsg("Une erreur inattendue est survenue.");
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-xl">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Ajouter une boutique
              </h3>
              <p className="text-[11px] text-zinc-400">
                Point de vente / succursale supplémentaire
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {successInfo ? (
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>
            <h4 className="text-base font-bold text-white">
              Demande enregistrée !
            </h4>
            <p className="text-xs leading-relaxed text-zinc-400">
              {successInfo.message}
            </p>
            {successInfo.whatsAppUrl && (
              <a
                href={successInfo.whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Ouvrir WhatsApp pour régler via BaridiMob</span>
              </a>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full border-zinc-800 text-xs text-zinc-400"
            >
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
            {/* Quota Banner */}
            {isQuotaReached ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                <div className="flex items-center gap-2 font-bold">
                  <CreditCard className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Option Multi-Boutiques (+2 500 DA / mois)</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-200/80">
                  Votre formule actuelle ({planName}) inclut {allowedCount}{" "}
                  boutique. Vous pouvez ajouter ce point de vente supplémentaire
                  via un règlement BaridiMob / CCP.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <span className="font-bold">Point de vente inclus :</span> Il
                vous reste {allowedCount - currentCount} boutique disponible sur
                votre formule.
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="storeName" className="text-xs text-zinc-300">
                  Nom de la boutique *
                </Label>
                <Input
                  id="storeName"
                  placeholder="ex: Succursale Hydra, Boutique Centre-Ville..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-xs text-white placeholder:text-zinc-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="storeCity" className="text-xs text-zinc-300">
                    Ville / Wilaya
                  </Label>
                  <Input
                    id="storeCity"
                    placeholder="ex: Alger, Oran..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="border-zinc-800 bg-zinc-900 text-xs text-white placeholder:text-zinc-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="storePhone" className="text-xs text-zinc-300">
                    Téléphone direct
                  </Label>
                  <Input
                    id="storePhone"
                    placeholder="ex: 0550 12 34 56"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-zinc-800 bg-zinc-900 text-xs text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="storeAddress" className="text-xs text-zinc-300">
                  Adresse exacte
                </Label>
                <Input
                  id="storeAddress"
                  placeholder="ex: 14 Rue Didouche Mourad, Niveau 1..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-xs text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="bg-primary text-primary-foreground gap-1.5 rounded-xl px-4 text-xs font-bold shadow-xs"
              >
                {renderSubmitButtonContent()}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
