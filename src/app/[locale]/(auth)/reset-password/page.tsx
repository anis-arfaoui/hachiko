"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password criteria check
  const passwordCriteria = useMemo(
    () => ({
      hasMinLength: newPassword.length >= 8,
      hasNumber: /\d/u.test(newPassword),
      hasUppercase: /[A-Z]/u.test(newPassword),
    }),
    [newPassword]
  );

  const isPasswordValid =
    passwordCriteria.hasMinLength &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasUppercase;

  const isInvalidToken = Boolean(urlError) || (!token && !isSuccess);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Jeton de réinitialisation manquant ou invalide.");
      return;
    }

    if (!isPasswordValid) {
      setError(
        "Votre mot de passe doit respecter les critères de sécurité ci-dessous (au moins 8 caractères, 1 chiffre et 1 majuscule)."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
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
              onClick={() => router.push("/forgot-password")}
            >
              Demander un nouveau lien
            </Button>
            <div className="text-center">
              <Link
                href="/sign-in"
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
            présent vous connecter à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            className="w-full"
            onClick={() => router.push("/sign-in")}
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
          Choisissez un nouveau mot de passe sécurisé pour votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-3 text-sm">
              {error}
            </div>
          )}

          {/* Nouveau mot de passe */}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Votre nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10 pl-10"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={
                  showNewPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password strength checklist */}
            {newPassword.length > 0 && (
              <div className="bg-muted/40 border-border/60 space-y-1 rounded-xl border p-2.5 text-[11px]">
                <span className="text-muted-foreground block text-[10px] font-semibold tracking-wider uppercase">
                  Sécurité du mot de passe :
                </span>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={cn(
                        "h-3.5 w-3.5",
                        passwordCriteria.hasMinLength
                          ? "text-emerald-600"
                          : "text-muted-foreground/50"
                      )}
                    />
                    <span
                      className={cn(
                        passwordCriteria.hasMinLength
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      Au moins 8 caractères
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={cn(
                        "h-3.5 w-3.5",
                        passwordCriteria.hasNumber
                          ? "text-emerald-600"
                          : "text-muted-foreground/50"
                      )}
                    />
                    <span
                      className={cn(
                        passwordCriteria.hasNumber
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      Au moins 1 chiffre
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={cn(
                        "h-3.5 w-3.5",
                        passwordCriteria.hasUppercase
                          ? "text-emerald-600"
                          : "text-muted-foreground/50"
                      )}
                    />
                    <span
                      className={cn(
                        passwordCriteria.hasUppercase
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      Au moins 1 lettre majuscule
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirmer le nouveau mot de passe */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Répétez votre nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10 pl-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
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
            href="/sign-in"
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
