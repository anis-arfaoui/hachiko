"use client";

import { CheckCircle2, Mail } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
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
import { sendVerificationEmail, signUp } from "@/lib/auth-client";

const SignUpPage = () => {
  const router = useRouter();
  const locale = useLocale();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // SAFETY: Better Auth dynamically accepts custom request fields like businessName
      const payload = {
        businessName: businessName.trim(),
        callbackURL: `/${locale}/onboarding`,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password,
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
        callbackURL: `/${locale}/onboarding`,
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
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center">
            {isSubmitted ? (
              <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                <Mail className="h-6 w-6" />
              </div>
            ) : (
              <Image
                src="/walaa-logo.png"
                alt="Walaa"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover shadow-sm"
                priority
              />
            )}
          </div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Walaa &bull; Fidélité Digitale
          </h1>
          <p className="text-muted-foreground text-sm">
            {isSubmitted
              ? "Activez votre compte pour continuer"
              : "Créez votre compte commerçant en quelques instants"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isSubmitted ? "Vérifiez vos emails" : "Inscription Commerçant"}
            </CardTitle>
            <CardDescription>
              {isSubmitted
                ? "Un lien de confirmation vous a été envoyé"
                : "Configurez votre boutique et votre programme de fidélité"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="space-y-4">
                <div className="bg-primary/5 border-primary/20 text-foreground space-y-2 rounded-lg border p-4 text-sm">
                  <div className="text-primary flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Lien d&apos;activation envoyé</span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Un email a été envoyé à <strong>{submittedEmail}</strong>.
                    Cliquez sur le lien reçu pour activer votre compte et
                    configurer votre programme de fidélité.
                  </p>
                </div>

                {resendStatus && (
                  <p className="text-muted-foreground text-center text-xs">
                    {resendStatus}
                  </p>
                )}

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                    disabled={isResending}
                  >
                    {isResending
                      ? "Renvoi en cours..."
                      : "Renvoyer l'email d'activation"}
                  </Button>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => router.push(`/${locale}/sign-in`)}
                  >
                    Déjà vérifié ? Se connecter
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
                  <Label htmlFor="name">Votre nom complet</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Karim Mansouri"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Nom de votre commerce</Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Café Lina"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                  <p className="text-muted-foreground text-xs">
                    Apparaîtra sur la carte de fidélité de vos clients.
                  </p>
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
                  {isLoading
                    ? "Création du compte..."
                    : "Créer mon compte commerçant"}
                </Button>
              </form>
            )}

            {!isSubmitted && (
              <div className="text-muted-foreground mt-6 text-center text-sm">
                Vous avez déjà un compte ?{" "}
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

export default SignUpPage;
