import Link from "next/link";

import { WalaaLogo } from "./logo";

interface LandingFooterProps {
  locale: string;
}

export const LandingFooter = ({ locale }: LandingFooterProps) => (
  <footer className="border-t border-white/10 pt-12 pb-10 text-xs text-white/60">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-6 border-b border-white/10 pb-8 md:flex-row">
        {/* Logo & Slogan */}
        <div className="flex items-center gap-3">
          <WalaaLogo className="text-primary h-7 w-7" />
          <div>
            <div className="text-lg font-bold tracking-tight text-white">
              Walaa
            </div>
            <p className="text-xs text-white/60">
              Plus de fidélité, plus de clients.
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/80">
          <a
            href="#fonctionnalites"
            className="transition-colors hover:text-white"
          >
            Fonctionnalités
          </a>
          <a href="#calculateur" className="transition-colors hover:text-white">
            Calculateur
          </a>
          <a href="#etapes" className="transition-colors hover:text-white">
            Comment ça marche
          </a>
          <a href="#tarifs" className="transition-colors hover:text-white">
            Tarifs
          </a>
          <a href="#avis" className="transition-colors hover:text-white">
            Avis
          </a>
        </div>

        {/* Status / Tag */}
        <div className="text-xs text-white/60">
          Fidélité Digitale pour Commerces en Algérie
        </div>
      </div>

      <div className="flex flex-col items-center justify-between pt-6 text-xs text-white/50 sm:flex-row">
        <div>© 2026 Walaa. Tous droits réservés.</div>
        <div className="mt-2 flex gap-4 sm:mt-0">
          <Link
            href={`/${locale}/sign-in`}
            className="text-white/60 transition-colors hover:text-white hover:underline"
          >
            Espace Commerçant
          </Link>
          <Link
            href={`/${locale}/sign-up`}
            className="text-white/60 transition-colors hover:text-white hover:underline"
          >
            Inscription
          </Link>
        </div>
      </div>
    </div>
  </footer>
);
