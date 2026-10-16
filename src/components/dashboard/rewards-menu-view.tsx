"use client";

import { Check, Gift, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { saveProgramRewardsAction } from "@/app/actions/rewards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RewardItem, SaveRewardInput } from "@/dal/rewards";
import { cn } from "@/lib/utils";

interface RewardsMenuViewProps {
  initialRewards: RewardItem[];
  program: {
    brandColor: string;
    id: string;
    rewardLabel: string;
    stampsRequired: number;
    type: "points" | "stamps";
  };
}

interface EditableReward {
  cost: string;
  description: string;
  id: string;
  label: string;
}

export const RewardsMenuView = ({
  initialRewards,
  program,
}: RewardsMenuViewProps) => {
  const isPoints = program.type === "points";

  const [rewardsList, setRewardsList] = useState<EditableReward[]>(() => {
    if (initialRewards.length > 0) {
      return initialRewards.map((r) => ({
        cost: String(r.cost),
        description: r.description || "",
        id: r.id,
        label: r.label,
      }));
    }
    return [
      {
        cost: String(program.stampsRequired || (isPoints ? 100 : 10)),
        description: "",
        id: crypto.randomUUID(),
        label: program.rewardLabel || "1 Récompense offerte",
      },
    ];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const handleAddReward = () => {
    let highestCost = 0;
    for (const r of rewardsList) {
      const num = Number(r.cost);
      if (!Number.isNaN(num) && num > highestCost) {
        highestCost = num;
      }
    }

    const step = isPoints ? 50 : 3;
    let baseCost = 3;
    if (isPoints) {
      baseCost = 30;
    }
    const nextCost = highestCost > 0 ? highestCost + step : baseCost;

    setRewardsList((prev) => [
      ...prev,
      {
        cost: String(nextCost),
        description: "",
        id: crypto.randomUUID(),
        label: "",
      },
    ]);
  };

  const handleRemoveReward = (index: number) => {
    if (rewardsList.length <= 1) {
      setSaveMessage({
        text: "Vous devez conserver au moins une récompense dans votre menu.",
        type: "error",
      });
      return;
    }
    setRewardsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateField = (
    index: number,
    field: keyof EditableReward,
    value: string
  ) => {
    setRewardsList((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSave = async () => {
    // Validate that all items have a label and a valid cost
    for (const item of rewardsList) {
      if (!item.label.trim()) {
        setSaveMessage({
          text: "Chaque récompense doit avoir un nom défini.",
          type: "error",
        });
        return;
      }
      const numCost = Math.trunc(Number(item.cost.trim()));
      if (Number.isNaN(numCost) || numCost <= 0) {
        setSaveMessage({
          text: `La récompense « ${item.label} » doit avoir un nombre de ${isPoints ? "points" : "tampons"} supérieur à 0.`,
          type: "error",
        });
        return;
      }
    }

    setIsSaving(true);
    setSaveMessage(null);

    const payload: SaveRewardInput[] = rewardsList.map((r) => ({
      cost: Math.max(1, Math.trunc(Number(r.cost.trim())) || 1),
      description: r.description.trim() || null,
      id: r.id,
      label: r.label.trim(),
    }));

    try {
      const res = await saveProgramRewardsAction(payload);
      if (res.success && res.rewards) {
        setSaveMessage({
          text: "Menu fidélité enregistré avec succès !",
          type: "success",
        });
        setRewardsList(
          res.rewards.map((r) => ({
            cost: String(r.cost),
            description: r.description || "",
            id: r.id,
            label: r.label,
          }))
        );
      } else {
        setSaveMessage({
          text:
            res.error || "Erreur lors de l'enregistrement du menu fidélité.",
          type: "error",
        });
      }
    } catch {
      setSaveMessage({
        text: "Erreur de connexion lors de l'enregistrement.",
        type: "error",
      });
    }

    setIsSaving(false);
  };

  // Preview sorted by cost
  const previewRewards = useMemo(
    () =>
      [...rewardsList].toSorted((a, b) => {
        const costA = Number(a.cost) || 0;
        const costB = Number(b.cost) || 0;
        return costA - costB;
      }),
    [rewardsList]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-foreground text-3xl font-black tracking-tight uppercase">
            Menu fidélité
          </h1>
          <span className="border-border bg-card inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold shadow-xs">
            <Gift className="text-primary h-3.5 w-3.5" />
            <span>{isPoints ? "Programme à points" : "Carte à tampons"}</span>
          </span>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          {isPoints
            ? "Vos clients cumulent des points et choisissent la récompense qu'ils veulent. Ils peuvent dépenser tout de suite ou économiser pour une plus belle récompense."
            : "Vos clients cumulent des tampons et choisissent la récompense qu'ils veulent. Ils peuvent dépenser tout de suite ou économiser pour une plus belle récompense."}
        </p>
      </div>

      {saveMessage && (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm font-semibold shadow-xs",
            saveMessage.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          )}
        >
          {saveMessage.text}
        </div>
      )}

      {/* 1. Rewards Editor Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <div className="flex items-center gap-2">
            <Gift className="text-foreground h-5 w-5" />
            <CardTitle className="text-base font-bold">
              Vos récompenses
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {rewardsList.map((reward, index) => (
            <div
              key={reward.id}
              className="border-border bg-muted/20 space-y-3 rounded-2xl border p-4 transition-all"
            >
              {/* Top Row: Label + Cost + Delete */}
              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
                <div className="space-y-1.5 sm:col-span-8">
                  <Label
                    htmlFor={`reward-label-${index}`}
                    className="text-foreground text-xs font-bold"
                  >
                    Récompense #{index + 1}
                  </Label>
                  <Input
                    id={`reward-label-${index}`}
                    value={reward.label}
                    onChange={(e) =>
                      handleUpdateField(index, "label", e.target.value)
                    }
                    placeholder="Ex: Café offert, 15% de remise..."
                    className="h-11 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <Label
                    htmlFor={`reward-cost-${index}`}
                    className="text-foreground text-xs font-bold"
                  >
                    {isPoints ? "Points requis" : "Tampons"}
                  </Label>
                  <Input
                    id={`reward-cost-${index}`}
                    type="number"
                    min={1}
                    max={isPoints ? 10_000 : 50}
                    value={reward.cost}
                    onChange={(e) =>
                      handleUpdateField(index, "cost", e.target.value)
                    }
                    className="h-11 text-center font-bold"
                    required
                  />
                </div>

                <div className="flex justify-end sm:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveReward(index)}
                    disabled={rewardsList.length <= 1}
                    title="Supprimer cette récompense"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-11 w-11 rounded-xl transition-colors"
                    aria-label={`Supprimer la récompense ${reward.label || index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Bottom Row: Optional precision / description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor={`reward-desc-${index}`}
                  className="text-muted-foreground text-xs font-semibold"
                >
                  Précision (facultatif)
                </Label>
                <Input
                  id={`reward-desc-${index}`}
                  value={reward.description}
                  onChange={(e) =>
                    handleUpdateField(index, "description", e.target.value)
                  }
                  placeholder="Ex: Hors formules déjà en promotion, valable du lundi au vendredi..."
                  className="h-10 text-xs"
                />
              </div>
            </div>
          ))}

          {/* Add Reward Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddReward}
            className="hover:border-foreground/50 hover:bg-muted/50 h-12 w-full rounded-2xl border-dashed text-xs font-bold transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Ajouter une récompense</span>
          </Button>
        </CardContent>
      </Card>

      {/* 2. Live Client Preview Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="text-base font-bold">
            Ce que verra votre client
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mx-auto w-full max-w-md">
            {/* Dark Styled Box (matching customer card) */}
            <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-2xl">
              <div className="flex items-center gap-2 text-xs font-black tracking-widest text-zinc-400 uppercase">
                <Gift className="h-3.5 w-3.5" />
                <span>Vos récompenses</span>
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-tight uppercase">
                Ce que vous pouvez gagner
              </h2>

              <p className="mt-1 mb-4 text-xs font-medium text-zinc-400">
                Aperçu indicatif : chaque client voit sa propre progression.
              </p>

              {/* Rewards List */}
              <div className="space-y-2">
                {previewRewards.length === 0 ? (
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-900/90 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600/90 text-white shadow-xs">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold text-zinc-300">
                        Récompense sans nom
                      </span>
                    </div>
                    <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-400">
                      3 {isPoints ? "points" : "tampons"}
                    </span>
                  </div>
                ) : (
                  previewRewards.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-zinc-900/90 p-3.5 shadow-sm transition-all"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-600/90 text-white shadow-xs">
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="truncate text-xs font-bold text-white">
                            {item.label || "Récompense sans nom"}
                          </div>
                          {item.description && (
                            <div className="truncate text-[11px] text-zinc-400">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="shrink-0 rounded-lg bg-zinc-800 px-2.5 py-1 font-mono text-xs font-semibold text-zinc-300">
                        {item.cost || "0"} {isPoints ? "points" : "tampons"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <p className="mt-4 text-[11px] font-medium text-zinc-400">
                Présentez votre carte en caisse pour utiliser une récompense.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-sm font-bold shadow-md transition-all"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? "Enregistrement..." : "Enregistrer le menu"}
        </Button>
      </div>
    </div>
  );
};
