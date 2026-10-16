"use client";

import {
  Check,
  Copy,
  Loader2,
  Plus,
  QrCode,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  createManagerAction,
  deleteManagerAction,
} from "@/app/actions/manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ManagerItem } from "@/dal/manager";

interface ManagersViewProps {
  initialManagers: ManagerItem[];
}

const formatRelativeTime = (date: Date | null): string => {
  if (!date) {
    return "En attente d'activation";
  }
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 60) {
    return "Dernière utilisation à l'instant";
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Dernière utilisation il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Dernière utilisation il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Dernière utilisation il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
};

export const ManagersView = ({ initialManagers }: ManagersViewProps) => {
  const [managersList, setManagersList] =
    useState<ManagerItem[]>(initialManagers);
  const [newManagerName, setNewManagerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [pairingManager, setPairingManager] = useState<ManagerItem | null>(
    null
  );
  const [pairingQrDataUrl, setPairingQrDataUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const [deletingManagerId, setDeletingManagerId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate QR for pairing modal
  useEffect(() => {
    let isMounted = true;
    if (pairingManager) {
      const host =
        typeof window === "undefined"
          ? "https://walaa.app"
          : window.location.origin;
      const pairingUrl = `${host}/responsable?code=${pairingManager.code}`;

      const generateQr = async () => {
        try {
          const url = await QRCode.toDataURL(pairingUrl, {
            margin: 1,
            scale: 8,
            width: 240,
          });
          if (isMounted) {
            setPairingQrDataUrl(url);
          }
        } catch {
          // ignore
        }
      };
      void generateQr();
    }

    return () => {
      isMounted = false;
    };
  }, [pairingManager]);

  // Handle Create Manager
  const handleCreateManager = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newManagerName.trim();
    if (!trimmed) {
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await createManagerAction(trimmed);
      if (res.success && res.manager) {
        setManagersList([res.manager, ...managersList]);
        setNewManagerName("");
        setPairingManager(res.manager);
      } else {
        setCreateError(
          res.error || "Une erreur est survenue lors de la création."
        );
      }
      setIsCreating(false);
    } catch {
      setCreateError("Erreur de connexion. Veuillez réessayer.");
      setIsCreating(false);
    }
  };

  // Handle Delete Manager
  const handleDeleteManager = async (managerId: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteManagerAction(managerId);
      if (res.success) {
        setManagersList((prev) => prev.filter((m) => m.id !== managerId));
        if (pairingManager?.id === managerId) {
          setPairingManager(null);
        }
      }
      setIsDeleting(false);
      setDeletingManagerId(null);
    } catch {
      setIsDeleting(false);
      setDeletingManagerId(null);
    }
  };

  // Handle Copy Link
  const handleCopyLink = () => {
    if (!pairingManager) {
      return;
    }
    const host =
      typeof window === "undefined"
        ? "https://walaa.app"
        : window.location.origin;
    const pairingUrl = `${host}/responsable?code=${pairingManager.code}`;

    navigator.clipboard.writeText(pairingUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-border bg-card inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-xs">
            <Shield className="text-foreground h-4 w-4" />
            <span className="text-foreground text-xs font-bold tracking-wide italic">
              Responsables
            </span>
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Donnez à vos managers et responsables un accès à votre commerce. Ils
          accèdent au tableau de bord, aux récompenses et aux caisses, sans
          accéder au programme ni à l&apos;apparence.
        </p>
      </div>

      {/* =========================================================================
          PAIRING BANNER / MODAL (Identical to Caisses employé)
          ========================================================================= */}
      {pairingManager && (
        <Card className="border-border bg-card relative overflow-hidden shadow-md">
          <button
            type="button"
            onClick={() => setPairingManager(null)}
            aria-label="Fermer"
            className="hover:bg-muted text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-lg p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <CardHeader className="border-border border-b pb-4">
            <CardTitle className="text-base font-bold">
              Activer la session de {pairingManager.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
              {/* Left Column: Instructions */}
              <div className="space-y-4 md:col-span-6">
                <ol className="text-foreground/90 space-y-2.5 text-xs leading-relaxed font-semibold">
                  <li className="flex items-start gap-2">
                    <span className="bg-muted text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                      1
                    </span>
                    <span>
                      Sur le téléphone du responsable, ouvrez{" "}
                      <strong className="text-foreground font-bold">
                        /responsable
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-muted text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                      2
                    </span>
                    <span>Ajoutez la page à l&apos;écran d&apos;accueil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-muted text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                      3
                    </span>
                    <span>Ouvrez l&apos;application ainsi créée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-muted text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                      4
                    </span>
                    <span>Scannez ce code, ou saisissez-le</span>
                  </li>
                </ol>

                {/* Big 6-Digit Code */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-foreground font-mono text-3xl font-black tracking-[0.35em] sm:text-4xl">
                    {pairingManager.code.split("").join(" ")}
                  </div>
                  <p className="text-muted-foreground text-xs font-medium">
                    Code d&apos;accès à 6 chiffres
                  </p>
                </div>

                {/* Copy Link Button */}
                <div className="space-y-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-10 w-full bg-zinc-950 text-xs font-bold text-white shadow-xs hover:bg-zinc-900 sm:w-auto"
                  >
                    {isCopied ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4 text-emerald-400" />
                        <span>Lien copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-4 w-4" />
                        <span>Copier le lien à envoyer</span>
                      </>
                    )}
                  </Button>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Envoyez ce lien au responsable s&apos;il ne peut pas scanner
                    : il s&apos;appaire tout seul en l&apos;ouvrant.
                  </p>
                </div>
              </div>

              {/* Right Column: QR Code */}
              <div className="flex flex-col items-center justify-center md:col-span-6">
                <div className="border-border rounded-2xl border bg-white p-4 shadow-sm">
                  {pairingQrDataUrl ? (
                    <Image
                      src={pairingQrDataUrl}
                      alt="QR Code d'activation responsable"
                      width={200}
                      height={200}
                      className="h-48 w-48 rounded-lg"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center">
                      <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPairingManager(null)}
                  className="text-muted-foreground hover:text-foreground mt-3 text-xs font-semibold underline underline-offset-4 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================================
          1. NOUVEAU RESPONSABLE CARD
          ========================================================================= */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Plus className="h-4 w-4" />
            <span>Nouveau responsable</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreateManager} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="newManagerName"
                className="text-foreground text-xs font-bold"
              >
                Prénom du responsable
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  id="newManagerName"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  placeholder="Youssef"
                  className="h-11 flex-1 text-sm font-medium"
                  required
                />
                <Button
                  type="submit"
                  disabled={isCreating || !newManagerName.trim()}
                  className="h-11 bg-red-600 px-6 font-bold text-white shadow-xs hover:bg-red-700"
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  <span>Créer</span>
                </Button>
              </div>
            </div>

            {createError && (
              <p className="text-destructive text-xs font-semibold">
                {createError}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* =========================================================================
          2. LISTE DES RESPONSABLES ACTIFS
          ========================================================================= */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="text-base font-bold">
            Responsables actifs ({managersList.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {managersList.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Aucun responsable configuré pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {managersList.map((manager) => (
                <div
                  key={manager.id}
                  className="border-border bg-card/60 flex flex-col gap-3 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="bg-muted text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-foreground text-sm font-bold">
                        {manager.name}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                        <span>⏱</span>
                        <span>{formatRelativeTime(manager.lastActiveAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPairingManager(manager)}
                      className="border-border bg-card hover:bg-muted text-foreground h-9 gap-1.5 rounded-xl text-xs font-semibold shadow-xs"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Appairer</span>
                    </Button>

                    {deletingManagerId === manager.id ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleDeleteManager(manager.id)}
                          className="h-9 rounded-xl text-xs font-bold"
                        >
                          {isDeleting ? "..." : "Confirmer"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingManagerId(null)}
                          className="h-9 rounded-xl text-xs font-semibold"
                        >
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingManagerId(manager.id)}
                        className="text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 h-9 gap-1.5 rounded-xl border-dashed text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Retirer</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
