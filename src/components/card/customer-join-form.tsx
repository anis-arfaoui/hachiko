"use client";

import { ArrowRight, Gift, Sparkles, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { joinProgramAction } from "@/app/actions/customer";
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
import { isValidAlgerianPhone } from "@/lib/phone";

interface CustomerJoinFormProps {
  locale: string;
  slug: string;
}

export const CustomerJoinForm = ({ locale, slug }: CustomerJoinFormProps) => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidAlgerianPhone(phone)) {
      setError(
        "Veuillez entrer un numéro de mobile algérien valide (ex: 0550 12 34 56 ou 06 / 07)"
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await joinProgramAction({
        name,
        orgSlugOrId: slug,
        phone,
      });

      if (!res.success) {
        if (res.error === "BUSINESS_NOT_FOUND") {
          setError("Commerce introuvable. Veuillez vérifier le lien.");
        } else if (res.error === "INVALID_PHONE") {
          setError("Numéro de téléphone invalide.");
        } else {
          setError("Une erreur est survenue lors de la création de la carte.");
        }
        setIsLoading(false);
        return;
      }

      router.push(`/${locale}/c/${res.token}`);
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-2xl shadow-md">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Carte de Fidélité
          </h1>
          <p className="text-muted-foreground max-w-xs text-sm">
            Obtenez votre carte en quelques secondes sur votre téléphone, sans
            application à installer.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rejoindre le programme</CardTitle>
            <CardDescription>
              Présentez votre carte à chaque passage pour cumuler des tampons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="customerName">Nom & Prénom</Label>
                <Input
                  id="customerName"
                  placeholder="Ex: Yacine Bouzid"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerPhone">Numéro de téléphone</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="05XX XX XX XX, 06XX... ou 07XX..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-muted-foreground text-xs">
                  Format algérien : 10 chiffres commençant par 05, 06 ou 07.
                </p>
              </div>

              <div className="border-border bg-muted/50 flex items-center gap-3 rounded-xl border p-3">
                <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Gift className="h-5 w-5" />
                </div>
                <div className="text-xs">
                  <span className="text-foreground block font-semibold">
                    100% Gratuit & Instantané
                  </span>
                  <span className="text-muted-foreground">
                    Votre carte s&apos;ouvre directement dans votre navigateur.
                  </span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                <span className="flex items-center justify-center gap-2">
                  <span>{isLoading ? "Création..." : "Recevoir ma carte"}</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-center text-xs">
          <Sparkles className="text-primary h-3.5 w-3.5" />
          <span>Fidélité Digitale Algérie</span>
        </div>
      </div>
    </div>
  );
};
