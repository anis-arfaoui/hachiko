import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface LandingHeroProps {
  locale?: string;
}

export const LandingHero = ({ locale: _locale }: LandingHeroProps = {}) => (
  <section className="custom-gradient-bg relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Left Column Content */}
        <div className="z-10 flex flex-col items-start lg:col-span-6">
          {/* Micro Badge */}
          <div className="border-primary/20 bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>FIDÉLITÉ DIGITALE • SANS APPLICATION</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-foreground mb-6 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-5xl">
            Faites <span className="text-primary">revenir.</span>
            <br />
            Vos meilleurs clients.
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-8 max-w-xl text-base leading-relaxed sm:text-lg">
            Des cartes de fidélité digitales simples et puissantes, avec des
            récompenses automatiques. Sans cartes papier, sans effort, juste
            plus de fidélité.
          </p>

          {/* CTAs */}
          <div className="mb-8 flex w-full flex-col items-stretch gap-3.5 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/sign-up"
              className="bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 inline-flex items-center justify-center rounded-full px-7 py-3.5 text-center text-sm font-bold shadow-lg transition-colors"
            >
              Créer mon programme <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center rounded-full border px-7 py-3.5 text-center text-sm font-semibold shadow-sm transition-colors"
            >
              Accéder à mon espace
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="text-primary inline-flex items-center">
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Simple à lancer
            </span>
            <span className="text-border">•</span>
            <span>Sans matériel</span>
            <span className="text-border">•</span>
            <span>Prêt en quelques minutes</span>
          </div>
        </div>

        {/* Right Column Visual */}
        <div className="relative flex items-center justify-center lg:col-span-6">
          <div className="relative w-full max-w-lg lg:max-w-none">
            <Image
              src="/images/walaa-hero.png"
              alt="Application de fidélité Walaa"
              width={640}
              height={560}
              priority
              className="h-auto w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);
