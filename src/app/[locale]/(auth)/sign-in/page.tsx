"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
} from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendVerificationEmail, signIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const SignInPage = () => {
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        rememberMe,
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
        callbackURL: `/${locale}/email-confirmed`,
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
      {/* Decorative background blue curved splashes */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-2.5">
            <Image
              src="/walaa-logo.png"
              alt="Walaa"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover shadow-xs"
              priority
            />
            <span className="text-foreground text-xl font-bold tracking-tight">
              Walaa
            </span>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              Bienvenue sur Walaa
            </span>
          </div>

          <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">
            Bon retour ! <br />
            <span className="text-blue-600">Heureux de vous revoir.</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Connectez-vous à votre espace pour accéder à votre carte de fidélité
            et à tous vos avantages.
          </p>
        </div>

        {/* Card Form */}
        <div className="border-border/70 bg-card/90 rounded-3xl border p-6 shadow-xl backdrop-blur-xs sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border-destructive/20 bg-destructive/10 text-destructive space-y-2 rounded-xl border p-3 text-xs font-medium">
                <p>{error}</p>
                {isUnverified && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-full rounded-lg"
                      onClick={handleResend}
                      disabled={isResending}
                    >
                      <RefreshCw
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          isResending && "animate-spin"
                        )}
                      />
                      {isResending
                        ? "Renvoi en cours..."
                        : "Renvoyer l'email d'activation"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {resendStatus && (
              <p className="text-center text-xs font-medium text-blue-600">
                {resendStatus}
              </p>
            )}

            {/* Email professionnel */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email professionnel</Label>
              <div className="relative">
                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@moncommerce.dz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label
                htmlFor="rememberMe"
                className="text-muted-foreground flex cursor-pointer items-center gap-2 select-none"
              >
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="border-border cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Se souvenir de moi</span>
              </label>

              <Link
                href={`/${locale}/forgot-password`}
                className="font-medium text-blue-600 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-muted-foreground mt-6 text-center text-xs sm:text-sm">
            Vous n&apos;avez pas de compte ?{" "}
            <Link
              href={`/${locale}/sign-up`}
              className="font-semibold text-blue-600 hover:underline"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
