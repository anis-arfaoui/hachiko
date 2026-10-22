"use client";

import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  Coins,
  Eye,
  Gift,
  Info,
  Plus,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { saveProgramRewardsAction } from "@/app/actions/rewards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Text } from "@/components/ui/text";
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

  const [rewardsList, setRewardsList] = useState<EditableReward[]>(() =>
    initialRewards.map((r) => ({
      cost: String(r.cost),
      description: r.description || "",
      id: r.id,
      label: r.label,
    }))
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const handleImportDefaultReward = () => {
    setRewardsList([
      {
        cost: String(program.stampsRequired || (isPoints ? 100 : 10)),
        description: "",
        id: crypto.randomUUID(),
        label: program.rewardLabel || "1 Récompense offerte",
      },
    ]);
    setSaveMessage(null);
  };

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
    const nextCost =
      highestCost > 0 ? highestCost + step : program.stampsRequired || baseCost;

    setRewardsList((prev) => [
      ...prev,
      {
        cost: String(nextCost),
        description: "",
        id: crypto.randomUUID(),
        label: "",
      },
    ]);
    setSaveMessage(null);
  };

  const handleRemoveReward = (index: number) => {
    setRewardsList((prev) => prev.filter((_, idx) => idx !== index));
    setSaveMessage(null);
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
    // Validate that all items (if any) have a label and a valid cost
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
          text:
            res.rewards.length === 0
              ? "Menu fidélité enregistré : aucune récompense active (section masquée sur la carte client)."
              : "Menu fidélité enregistré avec succès !",
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
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* 1. Standardized Walaa Page Header */}
      <PageHeader
        title="Menu fidélité"
        badge={
          <Badge
            variant="brand"
            size="default"
            className="gap-1.5 font-bold shadow-xs"
          >
            {isPoints ? (
              <Coins className="h-3.5 w-3.5" />
            ) : (
              <Award className="h-3.5 w-3.5" />
            )}
            <span>{isPoints ? "Programme à points" : "Carte à tampons"}</span>
          </Badge>
        }
        description={
          isPoints
            ? "Vos clients cumulent des points et choisissent la récompense qu'ils veulent. Ils peuvent dépenser tout de suite ou économiser pour une plus belle récompense."
            : "Vos clients cumulent des tampons et choisissent la récompense qu'ils veulent. Ils peuvent dépenser tout de suite ou économiser pour une plus belle récompense."
        }
        actions={
          <Button
            type="button"
            onClick={handleSave}
            isLoading={isSaving}
            className="gap-2 font-bold shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>
              {isSaving ? "Enregistrement..." : "Enregistrer le menu"}
            </span>
          </Button>
        }
      />

      {/* 2. Feedback Alert */}
      {saveMessage && (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold shadow-xs transition-all",
            saveMessage.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          )}
        >
          {saveMessage.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div className="flex-1 leading-relaxed">{saveMessage.text}</div>
        </div>
      )}

      {/* 3. Main Content: 2-column layout (Editor + Live Simulation) */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column: Rewards Editor */}
        <div className="space-y-6 lg:col-span-7">
          <Card className="border-border shadow-xs">
            <CardHeader className="border-border border-b pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">
                      Vos récompenses
                    </CardTitle>
                    <CardDescription>
                      Définissez les paliers et les cadeaux déblocables par vos
                      clients.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="neutral" size="sm" className="font-semibold">
                  {rewardsList.length} palier{rewardsList.length > 1 ? "s" : ""}{" "}
                  actif
                  {rewardsList.length > 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {rewardsList.length === 0 ? (
                <div className="border-border flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center">
                  <div className="bg-muted text-muted-foreground mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl">
                    <Gift className="h-7 w-7" />
                  </div>
                  <Heading level={4} className="text-foreground">
                    Aucune récompense dans votre menu
                  </Heading>
                  <Text
                    variant="muted"
                    className="mt-1.5 mb-5 max-w-md text-xs leading-relaxed"
                  >
                    Vous n&apos;avez défini aucune récompense active. Le bloc «
                    Vos récompenses » sera automatiquement masqué sur la carte
                    fidélité de vos clients.
                  </Text>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleAddReward}
                      className="gap-2 font-bold"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter une récompense</span>
                    </Button>
                    {program.rewardLabel && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImportDefaultReward}
                        className="gap-2 text-xs font-semibold"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>Importer « {program.rewardLabel} »</span>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                rewardsList.map((reward, index) => (
                  <div
                    key={reward.id}
                    className="border-border bg-card hover:border-primary/30 relative space-y-3.5 rounded-2xl border p-4.5 shadow-xs transition-colors"
                  >
                    {/* Item Sub-header */}
                    <div className="border-border/60 flex items-center justify-between border-b pb-2.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="neutral"
                          size="sm"
                          className="font-mono font-bold"
                        >
                          Palier #{index + 1}
                        </Badge>
                        {reward.label && (
                          <span className="text-foreground/80 truncate text-xs font-semibold">
                            {reward.label}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReward(index)}
                        title="Supprimer cette récompense"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 rounded-lg px-2.5 text-xs transition-colors"
                        aria-label={`Supprimer la récompense ${reward.label || index + 1}`}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        <span>Supprimer</span>
                      </Button>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      <div className="space-y-1.5 sm:col-span-8">
                        <Label
                          htmlFor={`reward-label-${index}`}
                          className="text-foreground text-xs font-bold"
                        >
                          Nom de la récompense
                        </Label>
                        <Input
                          id={`reward-label-${index}`}
                          icon={Gift}
                          value={reward.label}
                          onChange={(e) =>
                            handleUpdateField(index, "label", e.target.value)
                          }
                          placeholder="Ex: Café offert, 15% de réduction..."
                          className="h-10 text-sm font-medium"
                          required
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-4">
                        <Label
                          htmlFor={`reward-cost-${index}`}
                          className="text-foreground text-xs font-bold"
                        >
                          {isPoints ? "Points requis" : "Tampons requis"}
                        </Label>
                        <Input
                          id={`reward-cost-${index}`}
                          type="number"
                          min={1}
                          max={isPoints ? 10_000 : 50}
                          icon={isPoints ? Coins : Award}
                          rightElement={
                            <span className="text-muted-foreground text-[11px] font-bold uppercase">
                              {isPoints ? "pts" : "tampons"}
                            </span>
                          }
                          value={reward.cost}
                          onChange={(e) =>
                            handleUpdateField(index, "cost", e.target.value)
                          }
                          className="h-10 [appearance:textfield] font-bold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Description input */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`reward-desc-${index}`}
                        className="text-muted-foreground text-xs font-semibold"
                      >
                        Conditions & précisions (facultatif)
                      </Label>
                      <Input
                        id={`reward-desc-${index}`}
                        icon={Info}
                        value={reward.description}
                        onChange={(e) =>
                          handleUpdateField(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Ex: Hors formules déjà en promotion, valable du lundi au vendredi..."
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                ))
              )}

              {/* Action Buttons below list */}
              {rewardsList.length > 0 && (
                <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddReward}
                    className="hover:border-primary/50 hover:bg-primary/5 h-11 w-full flex-1 rounded-xl border-dashed text-xs font-bold transition-all"
                  >
                    <Plus className="text-primary mr-2 h-4 w-4" />
                    <span>Ajouter une récompense</span>
                  </Button>
                  {program.rewardLabel && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleImportDefaultReward}
                      className="text-muted-foreground hover:text-foreground text-xs"
                      title="Réinitialiser avec la récompense de base du programme"
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                      <span>Réimporter récompense de base</span>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Educational callout */}
          <div className="border-primary/20 bg-primary/5 rounded-2xl border p-4 text-xs">
            <div className="text-primary mb-1 flex items-center gap-2 font-bold">
              <Sparkles className="h-4 w-4" />
              <span>Conseil d&apos;engagement</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Structurez 3 à 4 paliers évolutifs (ex: une boisson à faible coût,
              une gourmandise intermédiaire, puis une réduction premium). Cela
              encourage vos clients à revenir plus souvent pour viser le palier
              suivant !
            </p>
          </div>
        </div>

        {/* Right Column: Live Pass Simulation */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:col-span-5">
          <Card className="border-border overflow-hidden shadow-xs">
            <CardHeader className="border-border bg-muted/20 border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="text-primary h-4 w-4" />
                  <CardTitle className="text-base font-bold">
                    Ce que verra votre client
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  size="sm"
                  className="gap-1 font-mono text-[11px] font-bold"
                >
                  <Eye className="h-3 w-3 text-emerald-500" /> Live Pass
                </Badge>
              </div>
              <CardDescription>
                Aperçu interactif de la section récompenses sur le pass de vos
                clients.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mx-auto w-full max-w-sm">
                {previewRewards.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/70 p-6 text-center text-zinc-400 shadow-xl">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500">
                      <Gift className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-zinc-200">
                      Section « Vos récompenses » masquée
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">
                      Aucune récompense active. Ce bloc ne sera pas affiché sur
                      le pass de vos clients tant que vous n&apos;avez pas
                      ajouté de palier.
                    </p>
                  </div>
                ) : (
                  /* Dark Styled Digital Pass Card */
                  <div className="relative rounded-3xl bg-zinc-950 p-5 text-white shadow-2xl ring-1 ring-white/10">
                    {/* Card Top Accent Bar */}
                    <div className="flex items-center justify-between pb-1 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                      <div className="flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5 text-amber-400" />
                        <span>Vos récompenses</span>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {previewRewards.length} palier
                        {previewRewards.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <h2 className="font-heading mt-1 text-xl font-black tracking-tight text-white uppercase">
                      Ce que vous pouvez gagner
                    </h2>

                    <p className="mt-1 mb-4 text-[11px] leading-normal font-medium text-zinc-400">
                      Aperçu indicatif : chaque client suit sa propre jauge de
                      progression.
                    </p>

                    {/* Rewards List */}
                    <div className="space-y-2">
                      {previewRewards.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/90 p-3 shadow-xs transition-colors hover:border-zinc-700"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs"
                              style={{
                                backgroundColor:
                                  program.brandColor || "#d97706",
                              }}
                            >
                              <Check className="h-4 w-4 stroke-[3]" />
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="truncate text-xs font-bold text-white">
                                {item.label.trim() || (
                                  <span className="text-zinc-500 italic">
                                    Récompense sans nom
                                  </span>
                                )}
                              </p>
                              {item.description?.trim() ? (
                                <p className="truncate text-[10px] text-zinc-400">
                                  {item.description.trim()}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <span className="shrink-0 rounded-lg border border-zinc-700/60 bg-zinc-800/90 px-2.5 py-1 font-mono text-[11px] font-bold text-zinc-200">
                            {item.cost || "0"} {isPoints ? "pts" : "tampons"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-zinc-800/80 pt-3 text-[10px] font-medium text-zinc-400">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>
                        Présentez votre carte en caisse pour utiliser une
                        récompense.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bottom Save Action Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleSave}
              isLoading={isSaving}
              className="h-11 w-full px-8 text-sm font-bold shadow-md transition-all sm:w-auto"
            >
              <Save className="h-4 w-4" />
              <span>
                {isSaving ? "Enregistrement..." : "Enregistrer le menu"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
