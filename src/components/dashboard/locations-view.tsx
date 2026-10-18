"use client";

import {
  Building2,
  Check,
  CreditCard,
  Edit2,
  Eye,
  Loader2,
  MapPin,
  Phone,
  Plus,
  QrCode,
  ScanLine,
  Store,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

import {
  deleteLocationAction,
  updateLocationAction,
} from "@/app/actions/location";
import { AddStoreModal } from "@/components/dashboard/add-store-modal";
import { CardPreviewModal } from "@/components/dashboard/card-preview-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LocationItem } from "@/dal/location";
import { cn } from "@/lib/utils";

interface LocationsViewProps {
  initialAllowedCount: number;
  initialLocations: LocationItem[];
  locale?: string;
  organizationName: string;
  planName?: string;
}

export const LocationsView = ({
  initialAllowedCount,
  initialLocations,
  locale = "fr",
  organizationName,
  planName = "Starter",
}: LocationsViewProps) => {
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Edit State
  const [editingLoc, setEditingLoc] = useState<LocationItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const activeCount = locations.filter((l) => l.status === "active").length;

  const handleOpenEdit = (loc: LocationItem) => {
    setEditingLoc(loc);
    setEditName(loc.name);
    setEditCity(loc.city || "");
    setEditAddress(loc.address || "");
    setEditPhone(loc.phone || "");
    setEditError(null);
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingLoc) {
      return;
    }

    if (!editName.trim() || editName.trim().length < 2) {
      setEditError(
        "Le nom de la boutique doit comporter au moins 2 caractères."
      );
      return;
    }

    setIsSavingEdit(true);
    const res = await updateLocationAction(editingLoc.id, {
      address: editAddress,
      city: editCity,
      name: editName,
      phone: editPhone,
    });

    const updatedLoc = res.location;
    if (res.success && updatedLoc) {
      setLocations((prev) =>
        prev.map((l) => (l.id === updatedLoc.id ? updatedLoc : l))
      );
      setEditingLoc(null);
    } else {
      setEditError(res.error || "Impossible de mettre à jour la boutique.");
    }
    setIsSavingEdit(false);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteLocationAction(id);
    if (res.success) {
      setLocations((prev) => prev.filter((l) => l.id !== id));
      setConfirmDeleteId(null);
    } else {
      setDeleteError(res.error || "Impossible de supprimer cette boutique.");
    }
    setIsDeleting(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black tracking-tight uppercase sm:text-3xl">
            Points de vente
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Gérez vos boutiques et succursales pour l&apos;établissement{" "}
            <strong className="text-foreground">{organizationName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewModalOpen(true)}
            className="rounded-xl text-xs font-semibold"
          >
            <Eye className="text-primary mr-1.5 h-3.5 w-3.5" />
            <span>Aperçu carte client</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-primary-foreground gap-1.5 rounded-xl text-xs font-bold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter une boutique</span>
          </Button>
        </div>
      </div>

      {/* Quota Overview Card */}
      <Card className="border-border bg-card overflow-hidden rounded-2xl shadow-xs">
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] font-black tracking-wider uppercase">
                  Capacité Formule {planName}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    activeCount >= initialAllowedCount
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {activeCount} / {initialAllowedCount} boutique
                  {initialAllowedCount > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Chaque boutique dispose de ses propres caisses et adresses, tout
                en partageant la même carte de fidélité pour vos clients.
              </p>
            </div>

            <Link href={`/${locale}/billing`}>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold"
              >
                <CreditCard className="text-muted-foreground mr-1.5 h-3.5 w-3.5" />
                <span>Gérer les options (+2 500 DA/m)</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Delete Error Notification */}
      {deleteError && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          {deleteError}
        </div>
      )}

      {/* Store Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => {
          const isPending = loc.status === "pending";

          return (
            <Card
              key={loc.id}
              className={cn(
                "border-border bg-card relative overflow-hidden rounded-2xl shadow-xs transition-all",
                isPending && "border-amber-500/30 bg-amber-500/5"
              )}
            >
              <CardHeader className="border-border border-b p-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        loc.isDefault
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground text-sm font-bold">
                        {loc.name}
                      </CardTitle>
                      {loc.isDefault && (
                        <span className="text-primary text-[10px] font-semibold">
                          ⭐ Siège principal
                        </span>
                      )}
                      {isPending && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-500">
                          En attente de règlement BaridiMob
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(loc)}
                      className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                      title="Modifier"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    {!loc.isDefault &&
                      (confirmDeleteId === loc.id ? (
                        <div className="bg-destructive/10 flex items-center gap-1 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(loc.id)}
                            disabled={isDeleting}
                            className="text-destructive hover:bg-destructive rounded px-1.5 py-0.5 text-[10px] font-bold hover:text-white"
                          >
                            {isDeleting ? "..." : "Supprimer"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-muted-foreground px-1 py-0.5 text-[10px]"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(loc.id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 p-4 text-xs">
                {/* Details */}
                <div className="text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {loc.address || "Adresse non renseignée"}
                    </span>
                  </div>
                  {loc.city && (
                    <div className="flex items-center gap-2">
                      <Building2 className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
                      <span>{loc.city}</span>
                    </div>
                  )}
                  {loc.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
                      <span>{loc.phone}</span>
                    </div>
                  )}
                </div>

                {/* Footer info: Caisses & QR */}
                <div className="border-border flex items-center justify-between border-t pt-3">
                  <div className="text-foreground flex items-center gap-1.5 font-semibold">
                    <ScanLine className="text-primary h-3.5 w-3.5" />
                    <span>
                      {loc.cashierCount || 0} caisse
                      {(loc.cashierCount || 0) > 1 ? "s" : ""}
                    </span>
                  </div>

                  <Link href={`/${locale}/qrcode`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground h-7 text-[11px]"
                    >
                      <QrCode className="mr-1 h-3 w-3" />
                      <span>Flyer QR</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Store Modal */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h3 className="text-sm font-bold text-white">
                Modifier la boutique : {editingLoc.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingLoc(null)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 p-5">
              {editError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
                  {editError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">
                  Nom de la boutique *
                </Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Ville</Label>
                  <Input
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="border-zinc-800 bg-zinc-900 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Téléphone</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="border-zinc-800 bg-zinc-900 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Adresse</Label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingLoc(null)}
                  disabled={isSavingEdit}
                  className="text-xs text-zinc-400"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingEdit}
                  className="bg-primary text-primary-foreground gap-1.5 rounded-xl px-4 text-xs font-bold"
                >
                  {isSavingEdit ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Enregistrer</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Store Modal */}
      <AddStoreModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        allowedCount={initialAllowedCount}
        currentCount={activeCount}
        planName={planName}
        onSuccess={(newLoc) => {
          setLocations((prev) => [...prev, newLoc]);
        }}
      />

      {/* Card Preview Modal */}
      <CardPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </div>
  );
};
