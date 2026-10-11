import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

interface LandingPricingProps {
  locale: string;
}

export const LandingPricing = ({ locale }: LandingPricingProps) => (
  <>
    {/* Pricing Section */}
    <section
      id="tarifs"
      className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <div className="mb-3 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold tracking-wider text-white uppercase">
          DES TARIFS SIMPLES
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Une offre adaptée à votre activité.
        </h2>
        <p className="mt-4 text-sm text-white/80 sm:text-base">
          Choisissez le plan qui correspond à vos besoins et commencez dès
          aujourd&apos;hui.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-8 md:grid-cols-2">
        {/* Plan 1: Essentiel */}
        <div className="border-primary bg-card text-foreground relative flex flex-col justify-between rounded-3xl border-2 p-8 shadow-2xl">
          <div className="bg-primary text-primary-foreground absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold tracking-wider uppercase shadow-md">
            Le plus populaire
          </div>
          <div>
            <h3 className="mb-1 text-xl font-extrabold">Essentiel</h3>
            <p className="text-muted-foreground mb-6 text-xs">
              Parfait pour les petits commerces et cafés indépendants.
            </p>
            <div className="border-border mb-6 flex items-baseline border-b pb-6">
              <span className="text-foreground text-4xl font-black">4,900</span>
              <span className="text-muted-foreground ml-1.5 text-sm font-bold">
                DZD / mois
              </span>
            </div>
            <ul className="text-foreground space-y-3.5 text-xs font-medium sm:text-sm">
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>Jusqu&apos;à 1 000 clients</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>1 établissement</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>Scanner de caisse illimité</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>Personnalisation de marque & logo</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>Support par email & WhatsApp</span>
              </li>
            </ul>
          </div>
          <Link
            href={`/${locale}/sign-up`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold shadow-md transition-colors"
          >
            Commencer <span className="ml-1.5">→</span>
          </Link>
        </div>

        {/* Plan 2: Pro */}
        <div className="border-border bg-card text-foreground flex flex-col justify-between rounded-3xl border p-8 shadow-xl">
          <div>
            <h3 className="mb-1 text-xl font-extrabold">Pro</h3>
            <p className="text-muted-foreground mb-6 text-xs">
              Pour les franchises et commerces en pleine croissance.
            </p>
            <div className="border-border mb-6 flex items-baseline border-b pb-6">
              <span className="text-foreground text-4xl font-black">9,900</span>
              <span className="text-muted-foreground ml-1.5 text-sm font-bold">
                DZD / mois
              </span>
            </div>
            <ul className="text-foreground space-y-3.5 text-xs font-medium sm:text-sm">
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>Jusqu&apos;à 10 000 clients</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>Jusqu&apos;à 3 établissements</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>Toutes les fonctionnalités avancées</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>Statistiques détaillées & export CSV</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="text-primary h-4 w-4 flex-shrink-0" />
                <span>Support dédié prioritaire</span>
              </li>
            </ul>
          </div>
          <Link
            href={`/${locale}/sign-up`}
            className="border-primary bg-card text-primary hover:bg-muted mt-8 inline-flex w-full items-center justify-center rounded-full border px-6 py-3.5 text-sm font-bold transition-colors"
          >
            Commencer <span className="ml-1.5">→</span>
          </Link>
        </div>
      </div>
    </section>

    {/* Final Call to Action */}
    <section className="mx-auto max-w-5xl border-t border-white/10 px-4 py-16 text-center sm:px-6 lg:px-8">
      <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Prêt à faire revenir vos clients ?
      </h2>
      <p className="mx-auto mb-8 max-w-xl text-sm text-white/80 sm:text-base">
        Créez votre programme de fidélité en quelques minutes et commencez dès
        aujourd&apos;hui sans matériel supplémentaire.
      </p>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href={`/${locale}/sign-up`}
          className="bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90 inline-flex w-full items-center justify-center rounded-full px-8 py-3.5 text-sm font-bold shadow-lg transition-colors sm:w-auto"
        >
          Créer mon programme <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link
          href={`/${locale}/sign-in`}
          className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 sm:w-auto"
        >
          Accéder à mon espace
        </Link>
      </div>
    </section>
  </>
);
