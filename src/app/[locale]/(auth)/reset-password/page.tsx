"use client";

import { AlertTriangle, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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
import { resetPassword } from "@/lib/auth-client";

const ResetPasswordForm = () => {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isInvalidToken = Boolean(urlError) || (!token && !isSuccess);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Jeton de réinitialisation manquant ou invalide");
      return;
    }

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);

    try {
      const res = await resetPassword({
        newPassword,
        token,
      });

      if (res.error) {
        setError(
          res.error.message ??
            "Ce lien a expiré ou est invalide. Veuillez demander un nouveau lien."
        );
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch {
      setError("Une erreur inattendue est survenue");
      setIsLoading(false);
    }
  };

  if (isInvalidToken) {
    return (
      <Card>
        <CardHeader>
          <div className="bg-destructive/10 text-destructive mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <CardTitle>Lien expiré ou invalide</CardTitle>
          <CardDescription>
            Ce lien de réinitialisation n&apos;est plus valable. Pour des
            raisons de sécurité, les liens expirent au bout d&apos;une heure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              type="button"
              className="w-full"
              onClick={() => router.push(`/${locale}/forgot-password`)}
            >
              Demander un nouveau lien
            </Button>
            <div className="text-center">
              <Link
                href={`/${locale}/sign-in`}
                className="text-muted-foreground hover:text-foreground text-sm underline transition-colors"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <CardTitle>Mot de passe mis à jour !</CardTitle>
          <CardDescription>
            Votre mot de passe a été modifié avec succès. Vous pouvez dès à
            présent vous connecter à votre espace commerçant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            className="w-full"
            onClick={() => router.push(`/${locale}/sign-in`)}
          >
            Se connecter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe pour sécuriser votre compte
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
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Minimum 8 caractères"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Répétez votre nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              "Mise à jour en cours..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Enregistrer le mot de passe
              </span>
            )}
          </Button>
        </form>

        <div className="text-muted-foreground mt-6 text-center text-sm">
          <Link
            href={`/${locale}/sign-in`}
            className="hover:text-primary underline transition-colors"
          >
            Annuler et retourner à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

const ResetPasswordLoading = () => (
  <Card>
    <CardHeader>
      <CardTitle>Chargement...</CardTitle>
      <CardDescription>
        Validation du lien de sécurité en cours...
      </CardDescription>
    </CardHeader>
  </Card>
);

const ResetPasswordPage = () => (
  <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          Walaa &bull; Réinitialisation
        </h1>
        <p className="text-muted-foreground text-sm">
          Définissez votre nouveau mot de passe
        </p>
      </div>

      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  </div>
);

export default ResetPasswordPage;
