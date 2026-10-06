"use client";

import { Check, Gift, Sparkles, Store } from "lucide-react";
import { useEffect, useState } from "react";

import { getMyProgramAction, saveProgramAction } from "@/app/actions/program";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveOrganization } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { bgClass: "bg-zinc-900", label: "Noir Élégant", value: "#18181b" },
  { bgClass: "bg-amber-700", label: "Ambre Café", value: "#b45309" },
  { bgClass: "bg-emerald-600", label: "Émeraude", value: "#059669" },
  { bgClass: "bg-blue-600", label: "Bleu Royal", value: "#2563eb" },
  { bgClass: "bg-rose-900", label: "Bordeaux", value: "#881337" },
  { bgClass: "bg-indigo-700", label: "Indigo", value: "#4338ca" },
] as const;

const getPresetBgClass = (colorValue: string): string => {
  const match = COLOR_PRESETS.find((p) => p.value === colorValue);
  return match?.bgClass ?? "bg-zinc-900";
};

const STAMP_PRESETS = [6, 8, 10, 12];

const countKey = (idx: number): string => `stamp-key-${idx}`;

const ProgramBuilderPage = () => {
  const { data: activeOrg } = useActiveOrganization();

  const [stampsRequired, setStampsRequired] = useState(10);
  const [rewardLabel, setRewardLabel] = useState("1 Récompense offerte");
  const [brandColor, setBrandColor] = useState("#18181b");
  const [logoUrl, setLogoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProgram = async () => {
      const existing = await getMyProgramAction();
      if (existing) {
        setStampsRequired(existing.stampsRequired);
        setRewardLabel(existing.rewardLabel);
        setBrandColor(existing.brandColor);
        setLogoUrl(existing.logoUrl ?? "");
      }
    };
    loadProgram();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const res = await saveProgramAction({
      brandColor,
      logoUrl: logoUrl || undefined,
      rewardLabel,
      stampsRequired,
    });

    if (res.success) {
      setSaveMessage("Programme enregistré avec succès !");
    } else {
      setSaveMessage("Erreur lors de l'enregistrement");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          Programme de Fidélité
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personnalisez la carte à tampons numérique qui sera affichée à vos
          clients.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* Settings Form */}
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Règles & Récompense</CardTitle>
              <CardDescription>
                Définissez le nombre de visites nécessaires pour débloquer le
                cadeau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {saveMessage && (
                  <div
                    className={cn(
                      "rounded-lg border p-3 text-sm font-medium",
                      saveMessage.includes("succès")
                        ? "bg-primary/10 border-primary/20 text-foreground"
                        : "bg-destructive/10 border-destructive/20 text-destructive"
                    )}
                  >
                    {saveMessage}
                  </div>
                )}

                {/* Number of stamps */}
                <div className="space-y-3">
                  <Label>
                    Nombre de tampons requis ({stampsRequired} visites)
                  </Label>
                  <div className="flex gap-2">
                    {STAMP_PRESETS.map((count) => (
                      <Button
                        key={count}
                        type="button"
                        variant={
                          stampsRequired === count ? "default" : "outline"
                        }
                        onClick={() => setStampsRequired(count)}
                        className="flex-1"
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Reward description */}
                <div className="space-y-2">
                  <Label htmlFor="rewardLabel">Intitulé du cadeau offert</Label>
                  <Input
                    id="rewardLabel"
                    value={rewardLabel}
                    onChange={(e) => setRewardLabel(e.target.value)}
                    placeholder="Ex: 1 Café offert, 1 Coupe gratuite..."
                    required
                  />
                  <p className="text-muted-foreground text-xs">
                    Ce texte apparaîtra sur la carte du client lorsqu&apos;il
                    aura rempli ses tampons.
                  </p>
                </div>

                {/* Brand color */}
                <div className="space-y-3">
                  <Label>Couleur de la marque</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setBrandColor(preset.value)}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                          brandColor === preset.value
                            ? "border-primary bg-secondary text-foreground shadow-sm"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full border border-black/20",
                            preset.bgClass
                          )}
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo URL */}
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">URL du Logo (optionnel)</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://moncommerce.dz/logo.png"
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Enregistrement..." : "Enregistrer le programme"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Customer Preview */}
        <div className="space-y-4 lg:col-span-5">
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="text-primary h-4 w-4" />
            <span>Aperçu en direct (Vue Smartphone)</span>
          </div>

          <div className="border-foreground/10 bg-background mx-auto w-full max-w-[340px] rounded-3xl border-4 p-4 shadow-xl">
            {/* Phone notch */}
            <div className="bg-foreground/10 mx-auto mb-4 h-4 w-28 rounded-full" />

            {/* Loyalty Card UI */}
            <div
              className={cn(
                "overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-colors",
                getPresetBgClass(brandColor)
              )}
            >
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <Store className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm leading-tight font-bold text-white">
                      {activeOrg?.name || "Mon Commerce"}
                    </h4>
                    <span className="text-xs text-white/80">
                      Carte Fidélité
                    </span>
                  </div>
                </div>
                <Gift className="h-5 w-5 text-white/80" />
              </div>

              {/* Progress */}
              <div className="my-4">
                <div className="mb-1.5 flex justify-between text-xs text-white/90">
                  <span>Tampons collectés</span>
                  <span className="font-bold">4 / {stampsRequired}</span>
                </div>

                {/* Stamp grid */}
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {Array.from({ length: stampsRequired }).map((_, idx) => {
                    const isCollected = idx < 4;
                    return (
                      <div
                        key={countKey(idx)}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-full text-xs font-bold transition-colors",
                          isCollected
                            ? "bg-white text-black shadow-sm"
                            : "border-2 border-dashed border-white/40 text-white/60"
                        )}
                      >
                        {isCollected ? (
                          <Check className="h-3.5 w-3.5 stroke-2" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reward preview banner */}
              <div className="mt-4 rounded-xl bg-white/15 p-2.5 text-center">
                <p className="text-xs tracking-wider text-white/80 uppercase">
                  Cadeau au {stampsRequired}ème tampon
                </p>
                <p className="mt-0.5 text-xs font-semibold text-white">
                  {rewardLabel || "Récompense offerte"}
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mt-4 text-center text-xs">
              Aperçu en temps réel de la carte affichée sur le téléphone du
              client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramBuilderPage;
