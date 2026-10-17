"use client";

import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Save,
} from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import {
  changePasswordAction,
  updateEstablishmentAction,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstablishmentDetails } from "@/dal/settings";

interface SettingsViewProps {
  initialDetails: EstablishmentDetails | null;
}

const ACTIVITY_OPTIONS = [
  "Commerce physique — mes clients viennent sur place",
  "Restauration / Café / Bar",
  "Beauté, Coiffure & Bien-être",
  "Commerce de détail / Boutique",
  "Services / Profession libérale",
  "Commerce en ligne / E-commerce",
  "Autre",
];

export const SettingsView = ({ initialDetails }: SettingsViewProps) => {
  // 1. Establishment Details Form State
  const [name, setName] = useState(initialDetails?.name || "");
  const [activityType, setActivityType] = useState(
    initialDetails?.activityType || ACTIVITY_OPTIONS[0]
  );
  const [phone, setPhone] = useState(initialDetails?.phone || "");
  const [city, setCity] = useState(initialDetails?.city || "");
  const [address, setAddress] = useState(initialDetails?.address || "");
  const [description, setDescription] = useState(
    initialDetails?.description || ""
  );

  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsFeedback, setDetailsFeedback] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  // 2. Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  // Save establishment details
  const handleSaveEstablishment = async (e: FormEvent) => {
    e.preventDefault();
    setDetailsFeedback(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setDetailsFeedback({
        message:
          "Le nom de l'établissement doit contenir au moins 2 caractères.",
        type: "error",
      });
      return;
    }

    setIsSavingDetails(true);
    try {
      const res = await updateEstablishmentAction({
        activityType,
        address,
        city,
        description,
        name: trimmedName,
        phone,
      });

      if (res.success && res.details) {
        setName(res.details.name);
        setDetailsFeedback({
          message: "Informations enregistrées avec succès !",
          type: "success",
        });
        setTimeout(() => {
          setDetailsFeedback(null);
        }, 4000);
      } else {
        setDetailsFeedback({
          message:
            res.error || "Une erreur est survenue lors de l'enregistrement.",
          type: "error",
        });
      }
    } catch {
      setDetailsFeedback({
        message: "Une erreur inattendue est survenue.",
        type: "error",
      });
    }
    setIsSavingDetails(false);
  };

  // Change password
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({
        message: "Veuillez entrer votre mot de passe actuel.",
        type: "error",
      });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordFeedback({
        message:
          "Le nouveau mot de passe doit comporter au moins 8 caractères.",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        message: "Les nouveaux mots de passe ne correspondent pas.",
        type: "error",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePasswordAction(currentPassword, newPassword);
      if (res.success) {
        setPasswordFeedback({
          message: "Mot de passe modifié avec succès !",
          type: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setPasswordFeedback(null);
        }, 4000);
      } else {
        setPasswordFeedback({
          message:
            res.error || "Impossible de modifier le mot de passe actuellement.",
          type: "error",
        });
      }
    } catch {
      setPasswordFeedback({
        message: "Une erreur inattendue est survenue.",
        type: "error",
      });
    }
    setIsChangingPassword(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-2xl font-black tracking-tight uppercase sm:text-3xl">
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Informations générales de votre établissement
        </p>
      </div>

      {/* 1. Établissement Card */}
      <Card className="border-border bg-card rounded-2xl p-6 shadow-xs sm:p-8">
        <form onSubmit={handleSaveEstablishment} className="space-y-6">
          <div className="border-border border-b pb-4">
            <h2 className="text-foreground text-lg font-bold">Établissement</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Informations visibles par vos clients sur leur carte de fidélité.
            </p>
          </div>

          <div className="space-y-4">
            {/* Nom */}
            <div className="space-y-1.5">
              <Label
                htmlFor="establishment-name"
                className="text-xs font-semibold"
              >
                Nom *
              </Label>
              <Input
                id="establishment-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Café de Paris"
                required
                className="rounded-xl"
              />
            </div>

            {/* Type d'activité */}
            <div className="space-y-1.5">
              <Label htmlFor="activity-type" className="text-xs font-semibold">
                Type d&apos;activité
              </Label>
              <select
                id="activity-type"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="border-input bg-background text-foreground ring-offset-background focus-visible:ring-ring focus:ring-ring flex h-10 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:outline-none focus-visible:ring-2 focus-visible:outline-none"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-[11px]">
                Un commerce en ligne n&apos;a ni comptoir ni caisse : nous
                masquons ce qui ne le concerne pas.
              </p>
            </div>

            {/* Téléphone & Ville */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="establishment-phone"
                  className="text-xs font-semibold"
                >
                  Téléphone
                </Label>
                <Input
                  id="establishment-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 6 00 00 00 00"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="establishment-city"
                  className="text-xs font-semibold"
                >
                  Ville
                </Label>
                <Input
                  id="establishment-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Casablanca"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-1.5">
              <Label
                htmlFor="establishment-address"
                className="text-xs font-semibold"
              >
                Adresse
              </Label>
              <Input
                id="establishment-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 rue Mohammed V"
                className="rounded-xl"
              />
            </div>

            {/* Description courte */}
            <div className="space-y-1.5">
              <Label
                htmlFor="establishment-desc"
                className="text-xs font-semibold"
              >
                Description courte
              </Label>
              <Input
                id="establishment-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Restaurant marocain traditionnel..."
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Feedback message */}
          {detailsFeedback && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                detailsFeedback.type === "success"
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-destructive/20 bg-destructive/10 text-destructive border"
              }`}
            >
              {detailsFeedback.type === "success" ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{detailsFeedback.message}</span>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSavingDetails}
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs transition-colors"
            >
              {isSavingDetails ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Mot de passe Card */}
      <Card className="border-border bg-card rounded-2xl p-6 shadow-xs sm:p-8">
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="border-border flex items-center gap-2.5 border-b pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold">
                Mot de passe
              </h2>
              <p className="text-muted-foreground text-xs">
                Modifiez votre mot de passe pour sécuriser votre compte.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Mot de passe actuel */}
            <div className="space-y-1.5">
              <Label
                htmlFor="current-password"
                className="text-xs font-semibold"
              >
                Mot de passe actuel
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-semibold">
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Minimum 8 caractères
              </p>
            </div>

            {/* Confirmer le nouveau mot de passe */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirm-password"
                className="text-xs font-semibold"
              >
                Confirmer le nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {passwordFeedback && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                passwordFeedback.type === "success"
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-destructive/20 bg-destructive/10 text-destructive border"
              }`}
            >
              {passwordFeedback.type === "success" ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          {/* Change Password Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="outline"
              disabled={isChangingPassword}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-xs transition-colors"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Modification...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Changer le mot de passe</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
