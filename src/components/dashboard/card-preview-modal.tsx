"use client";

import {
  Check,
  Copy,
  ExternalLink,
  Gift,
  MapPin,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { getClientCardPreviewDataAction } from "@/app/actions/location";
import type { CardPreviewData } from "@/app/actions/location";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CardPreviewModalProps {
  initialData?: CardPreviewData | null;
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { bgClass: "bg-zinc-900", value: "#18181b" },
  { bgClass: "bg-amber-700", value: "#b45309" },
  { bgClass: "bg-emerald-600", value: "#059669" },
  { bgClass: "bg-blue-600", value: "#2563eb" },
  { bgClass: "bg-rose-900", value: "#881337" },
  { bgClass: "bg-indigo-700", value: "#4338ca" },
] as const;

const getPresetBgClass = (colorValue: string): string => {
  const match = COLOR_PRESETS.find((p) => p.value === colorValue);
  return match?.bgClass ?? "bg-zinc-900";
};

export const CardPreviewModal = ({
  initialData,
  isOpen,
  onClose,
}: CardPreviewModalProps) => {
  const [fetchedData, setFetchedData] = useState<CardPreviewData | null>(null);
  const data = initialData ?? fetchedData;
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!isOpen || initialData) {
      return;
    }
    let isMounted = true;
    const loadPreviewData = async () => {
      setLoading(true);
      try {
        const res = await getClientCardPreviewDataAction();
        if (res && isMounted) {
          setFetchedData(res);
        }
      } catch {
        // Silently catch preview load errors
      }
      if (isMounted) {
        setLoading(false);
      }
    };
    void loadPreviewData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialData]);

  // Generate demo QR code
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let isMounted = true;
    const generateQr = async () => {
      const sampleToken = "demo-card-preview-token";
      try {
        const url = await QRCode.toDataURL(sampleToken, {
          errorCorrectionLevel: "H",
          margin: 1,
          scale: 6,
          width: 180,
        });
        if (isMounted) {
          setQrCodeUrl(url);
        }
      } catch {
        if (isMounted) {
          setQrCodeUrl(null);
        }
      }
    };
    void generateQr();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const joinUrl = data?.slug
    ? `${window.location.origin}/j/${data.slug}`
    : `${window.location.origin}/j/demo`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Simulated sample stamps
  const previewStamps = 3;
  const stampsRequired = data?.stampsRequired || 10;
  const brandColor = data?.brandColor || "#18181b";
  const bgClass = getPresetBgClass(brandColor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Aperçu de la carte client
              </h3>
              <p className="text-[11px] text-zinc-400">
                Comme vos clients la voient sur leur téléphone
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

        {/* Modal Body / Mobile Scrollable Frame */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading || !data ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-xs text-zinc-400">Chargement de la carte...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Store Switcher (if multiple stores) */}
              {data.locations.length > 1 && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    <Store className="h-3 w-3" />
                    <span>Sélectionner une boutique à prévisualiser :</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.locations.map((loc) => {
                      const isSelected =
                        selectedLocationId === loc.id ||
                        (!selectedLocationId && loc.isDefault);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => setSelectedLocationId(loc.id)}
                          className={cn(
                            "rounded-xl px-2.5 py-1 text-xs font-semibold transition-all",
                            isSelected
                              ? "bg-white text-zinc-950 shadow-xs"
                              : "bg-zinc-800 text-zinc-400 hover:text-white"
                          )}
                        >
                          {loc.name} {loc.isDefault && "⭐"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Shop Info Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-800 shadow-xs">
                    {data.logoUrl ? (
                      <Image
                        src={data.logoUrl}
                        alt={data.businessName}
                        fill
                        sizes="36px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Store className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm leading-tight font-bold text-white">
                      {data.businessName}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Client : Ahmed Benali
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Démo en direct
                </span>
              </div>

              {/* Loyalty Card Container */}
              <div
                className={cn(
                  "overflow-hidden rounded-3xl p-5 text-white shadow-xl transition-colors",
                  bgClass
                )}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    {data.logoUrl && (
                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/30 bg-white/20">
                        <Image
                          src={data.logoUrl}
                          alt="Logo"
                          fill
                          sizes="32px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-medium tracking-wider text-white/80 uppercase">
                        Carte de Fidélité
                      </span>
                      <h5 className="text-base font-extrabold text-white">
                        {data.businessName}
                      </h5>
                    </div>
                  </div>
                  <Gift className="h-5 w-5 text-white/90" />
                </div>

                {/* QR Code */}
                <div className="my-5 flex flex-col items-center justify-center">
                  <div className="rounded-2xl bg-white p-2.5 shadow-lg">
                    {qrCodeUrl ? (
                      <Image
                        src={qrCodeUrl}
                        alt="QR Code"
                        width={140}
                        height={140}
                        className="rounded-lg"
                        unoptimized
                      />
                    ) : (
                      <div className="h-[140px] w-[140px] bg-zinc-200" />
                    )}
                  </div>
                  <p className="mt-2 text-center text-[11px] font-medium text-white/80">
                    Présentez ce QR code à la caisse
                  </p>
                  <div className="mt-1.5 rounded-full bg-white/20 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white">
                    N° Client : WL-4920
                  </div>
                </div>

                {/* Stamps or Points */}
                {data.programType === "points" ? (
                  <div className="space-y-1.5 border-t border-white/20 pt-3">
                    <div className="flex items-center justify-between text-xs font-medium text-white/90">
                      <span>Progression des points</span>
                      <span className="font-bold">45 / 100 pts</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-white/20 p-0.5">
                      <div className="h-full w-[45%] rounded-full bg-white" />
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-white/20 pt-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-medium text-white/90">
                      <span>Vos tampons</span>
                      <span className="font-bold">
                        {previewStamps} / {stampsRequired}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: stampsRequired }).map((_, idx) => {
                        const isStamped = idx < previewStamps;
                        return (
                          <div
                            key={`preview-stamp-${idx}`}
                            className={cn(
                              "flex aspect-square items-center justify-center rounded-xl border transition-all",
                              isStamped
                                ? "border-white bg-white font-black text-zinc-950 shadow-xs"
                                : "border-white/30 bg-white/10 text-xs font-semibold text-white/50"
                            )}
                          >
                            {isStamped ? (
                              <Check className="h-4 w-4 stroke-[3]" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rewards Section */}
              {data.rewards && data.rewards.length > 0 && (
                <div className="space-y-2.5 rounded-2xl bg-zinc-900 p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    <Gift className="h-3.5 w-3.5 text-amber-500" />
                    <span>Récompenses déblocables</span>
                  </div>
                  <div className="space-y-1.5">
                    {data.rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between rounded-xl bg-zinc-800/80 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-zinc-200">
                          {reward.label}
                        </span>
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-400">
                          {reward.cost}{" "}
                          {data.programType === "points" ? "pts" : "tampons"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Store Addresses / Branches Section */}
              <div className="space-y-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    Nos boutiques & adresses ({data.locations.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {data.locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{loc.name}</span>
                        {loc.isDefault && (
                          <span className="bg-primary/20 text-primary-foreground rounded-full px-2 py-0.5 text-[9px] font-semibold">
                            Boutique Principale
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5 text-[11px] text-zinc-400">
                        {loc.address && <p>📍 {loc.address}</p>}
                        {loc.city && <p>🏙️ {loc.city}</p>}
                        {loc.phone && <p>📞 {loc.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col gap-2 border-t border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
          >
            {copiedLink ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                Lien copié !
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copier lien client (/j/...)
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {data?.slug && (
              <a
                href={`/j/${data.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-zinc-950 transition-opacity hover:opacity-90"
              >
                <span>Tester inscription</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
