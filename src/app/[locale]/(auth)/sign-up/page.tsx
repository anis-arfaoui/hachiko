"use client";

import { Store } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

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
import { orgClient, signUp } from "@/lib/auth-client";

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replaceAll(/[\s_]+/gu, "-")
    .replaceAll(/[^\w-]+/gu, "")
    .replaceAll(/--+/gu, "-");

const SignUpPage = () => {
  const router = useRouter();
  const locale = useLocale();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Sign up user
      const signUpRes = await signUp.email({
        email,
        name,
        password,
      });

      if (signUpRes.error) {
        setError(signUpRes.error.message ?? "Erreur lors de l'inscription");
        setIsLoading(false);
        return;
      }

      // 2. Create organization (business)
      const slug =
        slugify(businessName) || `shop-${crypto.randomUUID().slice(0, 8)}`;
      const orgRes = await orgClient.create({
        name: businessName,
        slug,
      });

      if (orgRes.error) {
        setError(
          orgRes.error.message ?? "Erreur lors de la création du commerce"
        );
        setIsLoading(false);
        return;
      }

      // 3. Set active organization
      if (orgRes.data?.id) {
        await orgClient.setActive({
          organizationId: orgRes.data.id,
        });
      }

      router.push(`/${locale}/dashboard/program`);
    } catch {
      setError("Une erreur inattendue est survenue");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Fidélité Digitale
          </h1>
          <p className="text-muted-foreground text-sm">
            Créez votre compte commerçant en quelques instants
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inscription Commerçant</CardTitle>
            <CardDescription>
              Configurez votre boutique et votre programme de fidélité
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
                <Label htmlFor="businessName">Nom de votre commerce</Label>
                <Input
                  id="businessName"
                  placeholder="Ex: Café Jasmin, Salon Élégance"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Votre nom complet</Label>
                <Input
                  id="name"
                  placeholder="Ex: Karim Benali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@moncommerce.dz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Création en cours..." : "Créer mon commerce"}
              </Button>
            </form>

            <div className="text-muted-foreground mt-6 text-center text-sm">
              Vous avez déjà un compte ?{" "}
              <Link
                href={`/${locale}/sign-in`}
                className="text-foreground hover:text-primary font-medium underline transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;
