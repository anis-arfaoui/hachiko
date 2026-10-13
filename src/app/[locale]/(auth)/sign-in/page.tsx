"use client";

import { Store } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
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
import { sendVerificationEmail, signIn } from "@/lib/auth-client";

const SignInPage = () => {
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setResendStatus(null);
    setIsLoading(true);

    try {
      const res = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.error) {
        const errorMsg = res.error.message ?? "";
        const isNotVerified =
          res.error.code === "EMAIL_NOT_VERIFIED" ||
          errorMsg.toLowerCase().includes("verified") ||
          errorMsg.toLowerCase().includes("vérifié");

        if (isNotVerified) {
          setIsUnverified(true);
          setError(
            "Votre compte n'est pas encore activé. Veuillez cliquer sur le lien envoyé à votre adresse email."
          );
        } else {
          setError(res.error.message ?? "Email ou mot de passe incorrect");
        }
        setIsLoading(false);
        return;
      }

      // Full page navigation ensures session cookies are reliably sent to server layout
      window.location.href = `/${locale}/dashboard`;
    } catch {
      setError("Une erreur inattendue est survenue");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending) {
      return;
    }
    setIsResending(true);
    setResendStatus(null);

    try {
      const res = await sendVerificationEmail({
        callbackURL: `/${locale}/dashboard`,
        email: email.trim().toLowerCase(),
      });

      if (res.error) {
        setResendStatus(
          res.error.message ?? "Impossible de renvoyer l'email de confirmation"
        );
        setIsResending(false);
        return;
      }

      setResendStatus("Email d'activation renvoyé ! Vérifiez votre boîte.");
      setIsResending(false);
    } catch {
      setResendStatus("Erreur lors du renvoi");
      setIsResending(false);
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
            Accédez à l&apos;administration de votre programme
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connexion Commerçant</CardTitle>
            <CardDescription>
              Connectez-vous pour voir vos statistiques et votre programme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border-destructive/20 text-destructive space-y-2 rounded-lg border p-3 text-sm">
                  <p>{error}</p>
                  {isUnverified && (
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleResend}
                        disabled={isResending}
                      >
                        {isResending
                          ? "Renvoi en cours..."
                          : "Renvoyer l'email d'activation"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {resendStatus && (
                <p className="text-muted-foreground text-center text-xs">
                  {resendStatus}
                </p>
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
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-muted-foreground hover:text-primary text-xs underline-offset-4 transition-colors hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

            <div className="text-muted-foreground mt-6 text-center text-sm">
              Vous n&apos;avez pas encore de compte ?{" "}
              <Link
                href={`/${locale}/sign-up`}
                className="text-foreground hover:text-primary font-medium underline transition-colors"
              >
                Créer mon commerce
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignInPage;
