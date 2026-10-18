"use client";

import { Check, ChevronDown, Clock, Plus, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { LocationItem } from "@/dal/location";
import { cn } from "@/lib/utils";

interface StoreSwitcherProps {
  locations: LocationItem[];
  onAddStoreClick: () => void;
  onSelectStore: (locationId: string | null) => void;
  selectedLocationId: string | null;
}

export const StoreSwitcher = ({
  locations,
  onAddStoreClick,
  onSelectStore,
  selectedLocationId,
}: StoreSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const currentStore = locations.find((l) => l.id === selectedLocationId);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Switcher Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="border-border bg-muted/40 hover:bg-muted text-foreground flex w-full items-center justify-between gap-2 rounded-xl border p-2 text-left transition-colors"
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
            <Store className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1 truncate">
            <div className="truncate text-xs leading-tight font-bold">
              {currentStore ? currentStore.name : "Toutes les boutiques"}
            </div>
            {currentStore?.city && (
              <div className="text-muted-foreground truncate text-[10px]">
                {currentStore.city}
              </div>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="border-border bg-card text-foreground absolute top-full left-0 z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border p-1.5 shadow-xl">
          <div className="text-muted-foreground px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
            Points de vente ({locations.length})
          </div>

          <div className="space-y-0.5 pt-1">
            {/* All Stores option */}
            <button
              type="button"
              onClick={() => {
                onSelectStore(null);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-colors",
                selectedLocationId === null
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <Store className="h-3.5 w-3.5" />
                <span>Toutes les boutiques (Global)</span>
              </div>
              {selectedLocationId === null && <Check className="h-3.5 w-3.5" />}
            </button>

            {/* Individual stores */}
            {locations.map((loc) => {
              const isSelected = selectedLocationId === loc.id;
              const isPending = loc.status === "pending";

              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    onSelectStore(loc.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">{loc.name}</span>
                      {loc.isDefault && (
                        <span className="text-[10px]" title="Siège principal">
                          ⭐
                        </span>
                      )}
                      {isPending && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
                          <Clock className="h-2.5 w-2.5" />
                          En attente
                        </span>
                      )}
                    </div>
                    {loc.city && (
                      <div
                        className={cn(
                          "truncate text-[10px]",
                          isSelected
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {loc.city} {loc.address ? `• ${loc.address}` : ""}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-border my-1 border-t" />

          {/* Add store trigger */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAddStoreClick();
            }}
            className="text-primary hover:bg-primary/10 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter une boutique...</span>
          </button>
        </div>
      )}
    </div>
  );
};
