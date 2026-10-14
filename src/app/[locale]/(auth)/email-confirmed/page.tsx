"use client";

import { ArrowRight, Check, Mail } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";

const EmailConfirmedPage = () => {
  const locale = useLocale();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Decorative background blue curves inspired by Walaa triptych */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-8 text-center">
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/walaa-logo.png"
            alt="Walaa"
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover shadow-xs"
            priority
          />
          <span className="text-foreground text-xl font-bold tracking-tight">
            Walaa
          </span>
        </div>

        {/* Confirmation Card */}
        <div className="border-border/70 bg-card/90 space-y-6 rounded-3xl border p-8 shadow-xl backdrop-blur-xs">
          {/* Envelope Badge with Checkmark */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <div className="relative flex items-center justify-center">
              <Mail className="h-10 w-10 stroke-[1.8]" />
              <div className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full shadow-xs">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-foreground text-2xl font-black tracking-tight uppercase sm:text-3xl">
              Email Confirmé
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Votre adresse est validée, votre compte commerçant est actif.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/${locale}/onboarding`}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              Créer mon commerce <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmedPage;
