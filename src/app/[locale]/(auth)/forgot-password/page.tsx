"use client";

import { CheckCircle2, KeyRound, Mail } from "lucide-react";
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
import { requestPasswordReset } from "@/lib/auth-client";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: `/${locale}/reset-password`,
      });

      if (res.error) {
        setError(
          res.error.message ?? "Une erreur est survenue lors de la demande"
        );
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
      setIsLoading(false);
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
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Walaa &bull; Récupération
          </h1>
          <p className="text-muted-foreground text-sm">
            Réinitialisez l&apos;accès à votre compte commerçant
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isSubmitted ? "Email envoyé" : "Mot de passe oublié"}
            </CardTitle>
            <CardDescription>
              {isSubmitted
                ? "Consultez votre boîte de réception pour continuer"
                : "Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="space-y-4">
                <div className="bg-primary/5 border-primary/20 text-foreground space-y-2 rounded-lg border p-4 text-sm">
                  <div className="text-primary flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Lien de réinitialisation envoyé</span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Si un compte commerçant est associé à{" "}
                    <strong>{email}</strong>, un email contenant un lien valable
                    pendant 1 heure vient d&apos;être envoyé.
                  </p>
                </div>

                <div className="bg-muted/40 text-muted-foreground space-y-1 rounded-lg border p-3 text-xs">
                  <p className="text-foreground font-medium">
                    Vous ne recevez rien ?
                  </p>
                  <ul className="list-inside list-disc space-y-0.5">
                    <li>
                      Vérifiez votre dossier de courriers indésirables (spams).
                    </li>
                    <li>Vérifiez l&apos;orthographe de votre adresse email.</li>
                  </ul>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                    }}
                  >
                    Utiliser une autre adresse
                  </Button>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => router.push(`/${locale}/sign-in`)}
                  >
                    Retour à la connexion
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@moncommerce.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-muted-foreground text-xs">
                    L&apos;adresse utilisée lors de la création de votre
                    commerce.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    "Envoi en cours..."
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      Envoyer le lien de réinitialisation
                    </span>
                  )}
                </Button>
              </form>
            )}

            {!isSubmitted && (
              <div className="text-muted-foreground mt-6 text-center text-sm">
                Vous vous souvenez de votre mot de passe ?{" "}
                <Link
                  href={`/${locale}/sign-in`}
                  className="text-foreground hover:text-primary font-medium underline transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
