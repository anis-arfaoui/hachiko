"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendVerificationEmail, signUp } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Password strength checks
  const passwordCriteria = useMemo(
    () => ({
      hasMinLength: password.length >= 8,
      hasNumber: /\d/u.test(password),
      hasUppercase: /[A-Z]/u.test(password),
    }),
    [password]
  );

  const isPasswordValid =
    passwordCriteria.hasMinLength &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasUppercase;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError(
        "Votre mot de passe doit respecter les critères de sécurité ci-dessous."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    try {
      // SAFETY: Better Auth dynamically accepts custom request fields like phoneNumber
      const payload = {
        callbackURL: "/email-confirmed",
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password,
        phoneNumber: phone.trim(),
      } as Parameters<typeof signUp.email>[0];

      const signUpRes = await signUp.email(payload);

      if (signUpRes.error) {
        setError(signUpRes.error.message ?? "Erreur lors de l'inscription");
        setIsLoading(false);
        return;
      }

      setSubmittedEmail(email.trim().toLowerCase());
      setIsSubmitted(true);
      setIsLoading(false);
    } catch {
      setError("Une erreur inattendue est survenue");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail || isResending) {
      return;
    }
    setIsResending(true);
    setResendStatus(null);

    try {
      const res = await sendVerificationEmail({
        callbackURL: "/email-confirmed",
        email: submittedEmail,
      });

      if (res.error) {
        setResendStatus(
          res.error.message ?? "Impossible de renvoyer l'email de confirmation"
        );
        setIsResending(false);
        return;
      }

      setResendStatus("Email de confirmation renvoyé avec succès !");
      setIsResending(false);
    } catch {
      setResendStatus("Erreur lors du renvoi");
      setIsResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
      {/* Decorative background blue curved shapes inspired by Walaa triptych */}
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
              {isSubmitted ? "Vérification" : "Inscription"}
            </span>
          </div>

          <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">
            {isSubmitted ? (
              "Vérifiez votre boîte mail"
            ) : (
              <>
                Rejoignez Walaa <br />
                <span className="text-blue-600">en quelques secondes.</span>
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {isSubmitted
              ? "Nous avons envoyé un lien de confirmation à votre adresse e-mail."
              : "Créez votre compte pour commencer à profiter de tous les avantages de votre carte de fidélité."}
          </p>
        </div>

        {/* Card Form or Submitted View */}
        <div className="border-border/70 bg-card/90 rounded-3xl border p-6 shadow-xl backdrop-blur-xs sm:p-8">
          {isSubmitted ? (
            <div className="space-y-6 text-center">
              {/* Envelope illustration badge */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <div className="relative flex items-center justify-center">
                  <Mail className="h-10 w-10 stroke-[1.8]" />
                  <div className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full shadow-xs">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* Informational Card */}
              <div className="border-border bg-muted/40 space-y-1.5 rounded-2xl border p-4 text-left">
                <div className="text-foreground flex items-center gap-2 text-xs font-semibold">
                  <HelpCircle className="h-4 w-4 shrink-0 text-blue-600" />
                  <span>Vous n&apos;avez pas reçu l&apos;email ?</span>
                </div>
                <p className="text-muted-foreground pl-6 text-xs leading-relaxed">
                  Vérifiez vos spams ou réessayez dans quelques minutes à
                  l&apos;adresse <strong>{submittedEmail}</strong>.
                </p>
              </div>

              {resendStatus && (
                <p className="text-xs font-medium text-blue-600">
                  {resendStatus}
                </p>
              )}

              <div className="space-y-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11 w-full rounded-xl"
                  onClick={handleResend}
                  disabled={isResending}
                >
                  <RefreshCw
                    className={cn(
                      "mr-2 h-4 w-4",
                      isResending && "animate-spin"
                    )}
                  />
                  {isResending ? "Renvoi en cours..." : "Renvoyer l'email"}
                </Button>

                <p className="text-muted-foreground text-xs">
                  Vous pouvez fermer cette page et revenir une fois votre compte
                  confirmé.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-3 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Nom complet */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre nom et prénom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

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

              {/* Numéro de téléphone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <div className="relative">
                  <Phone className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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

                {/* Password strength checklist */}
                {password.length > 0 && (
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

              {/* Confirmer le mot de passe */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmez votre mot de passe"
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
                    Création du compte...
                  </>
                ) : (
                  <>
                    Créer mon compte <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {!isSubmitted && (
            <div className="text-muted-foreground mt-6 text-center text-xs sm:text-sm">
              Déjà un compte ?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-blue-600 hover:underline"
              >
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
