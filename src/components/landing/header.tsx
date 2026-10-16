import Link from "next/link";

import { WalaaLogo } from "./logo";

interface LandingHeaderProps {
  locale?: string;
}

export const LandingHeader = ({ locale: _locale }: LandingHeaderProps = {}) => (
  <header className="bg-background/80 border-border sticky top-0 z-50 border-b backdrop-blur-md">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Brand Logo */}
      <Link
        href="/"
        className="group flex items-center gap-2.5 focus:outline-none"
      >
        <WalaaLogo className="h-8 w-8 transition-transform group-hover:scale-105" />
        <span className="text-foreground text-2xl font-extrabold tracking-tight">
          Walaa
        </span>
      </Link>

      {/* Navigation Links */}
      <nav className="text-muted-foreground hidden items-center gap-8 text-sm font-medium md:flex">
        <a
          href="#fonctionnalites"
          className="hover:text-primary transition-colors"
        >
          Fonctionnalités
        </a>
        <a href="#calculateur" className="hover:text-primary transition-colors">
          Calculateur
        </a>
        <a href="#etapes" className="hover:text-primary transition-colors">
          Comment ça marche
        </a>
        <a href="#tarifs" className="hover:text-primary transition-colors">
          Tarifs
        </a>
        <a href="#avis" className="hover:text-primary transition-colors">
          Avis
        </a>
      </nav>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-primary text-xs font-semibold transition-colors sm:text-sm"
        >
          Connexion
        </Link>
        <Link
          href="/sign-up"
          className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-semibold shadow-sm transition-colors active:scale-95 sm:text-sm"
        >
          Commencer <span className="ml-1.5">→</span>
        </Link>
      </div>
    </div>
  </header>
);
