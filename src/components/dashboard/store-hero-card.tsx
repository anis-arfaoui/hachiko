"use client";

import { Check, ChevronDown, Plus, Store } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { LocationItem } from "@/dal/location";
import { cn } from "@/lib/utils";

interface StoreHeroCardProps {
  bannerUrl?: string | null;
  locations: LocationItem[];
  logoUrl?: string | null;
  onOpenAddStore: () => void;
  onOpenCardPreview: () => void;
  onSelectStore: (locationId: string | null) => void;
  orgName: string;
  selectedLocationId: string | null;
  slug?: string | null;
}

export const StoreHeroCard = ({
  bannerUrl,
  locations,
  logoUrl,
  onOpenAddStore,
  onOpenCardPreview,
  onSelectStore,
  orgName,
  selectedLocationId,
  slug,
}: StoreHeroCardProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const currentStore = locations.find((l) => l.id === selectedLocationId);
  const cleanSlug = slug || orgName.toLowerCase().replaceAll(/\s+/gu, "");
  const domainText = `${cleanSlug}.walaa.dz`;
  const bgImage = bannerUrl || logoUrl;

  return (
    <div
      ref={dropdownRef}
      className="border-border/60 bg-muted/20 relative flex flex-col items-center rounded-2xl border p-4 shadow-2xs transition-all"
    >
      {/* 1. Ambient Faded Banner / Logo Background (matching reference screenshot) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {bgImage ? (
          <Image
            src={bgImage}
            alt=""
            fill
            sizes="240px"
            className="scale-150 object-cover opacity-25 blur-xl dark:opacity-15"
            unoptimized
          />
        ) : (
          <div className="from-primary/15 via-primary/5 absolute inset-0 bg-gradient-to-b to-transparent" />
        )}
        <div className="via-card/30 to-card/90 absolute inset-0 bg-gradient-to-b from-transparent" />
      </div>

      {/* 2. Squircle App Icon in Center (matching reference screenshot) */}
      <div className="dark:bg-card relative z-10 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-white shadow-lg ring-1 shadow-black/8 ring-black/5 dark:border-white/10">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={orgName}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center">
            <Store className="h-7 w-7" />
          </div>
        )}
      </div>

      {/* 3. Store Name with Chevron Dropdown Trigger */}
      <div className="relative z-10 mt-3 w-full">
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="group mx-auto flex max-w-[200px] cursor-pointer items-center justify-center gap-1.5 text-center select-none"
        >
          <span className="font-heading text-foreground group-hover:text-primary truncate text-sm font-bold tracking-tight transition-colors">
            {currentStore ? currentStore.name : orgName}
          </span>
          <ChevronDown
            className={cn(
              "text-muted-foreground group-hover:text-foreground h-3.5 w-3.5 shrink-0 transition-transform duration-200",
              isDropdownOpen && "text-primary rotate-180"
            )}
          />
        </button>

        {/* Dropdown Popover Menu (Boutiques list & Add boutique) */}
        {isDropdownOpen && (
          <div className="border-border bg-card text-foreground absolute top-full left-1/2 z-50 mt-2 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border p-1.5 shadow-2xl">
            <div className="text-muted-foreground px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
              Points de vente ({locations.length})
            </div>

            <div className="space-y-0.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectStore(null);
                  setIsDropdownOpen(false);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-colors",
                  selectedLocationId === null
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <Store className="h-3.5 w-3.5" />
                  <span>Vue Globale (Toutes)</span>
                </div>
                {selectedLocationId === null && (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>

              {locations.map((loc) => {
                const isSelected = selectedLocationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onSelectStore(loc.id);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="min-w-0 flex-1 truncate pr-2">
                      <div className="truncate">
                        {loc.name} {loc.isDefault && "⭐"}
                      </div>
                      {loc.city && (
                        <div
                          className={cn(
                            "text-[10px]",
                            isSelected
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {loc.city}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="border-border mt-1 border-t pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  onOpenAddStore();
                }}
                className="hover:bg-primary/10 text-primary flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter une boutique</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Pill Button: Clicking opens the Loyalty Card (matching reference screenshot) */}
      <div className="relative z-10 mt-2.5 flex items-center justify-center">
        <button
          type="button"
          onClick={onOpenCardPreview}
          className="border-border/80 bg-card hover:bg-muted/80 hover:border-primary/40 text-foreground relative inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium shadow-2xs transition-all select-none"
          title="Voir la carte de fidélité"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="truncate">{domainText}</span>
        </button>
      </div>
    </div>
  );
};
