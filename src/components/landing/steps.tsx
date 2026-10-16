import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface LandingStepsProps {
  locale?: string;
}

export const LandingSteps = ({ locale: _locale }: LandingStepsProps = {}) => (
  <section id="etapes" className="bg-card py-20 lg:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <div className="bg-primary/10 text-primary mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
          EN 3 ÉTAPES SIMPLES
        </div>
        <h2 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
          De l&apos;inscription au premier scan <br />
          <span className="text-primary">en 10 minutes.</span>
        </h2>
        <p className="text-muted-foreground mt-4 text-sm sm:text-base">
          Pas besoin de matériel coûteux. Créez votre programme, personnalisez
          vos récompenses et commencez à fidéliser vos clients immédiatement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Step 1 */}
        <div className="border-border bg-background flex flex-col justify-between rounded-3xl border p-8 transition-shadow hover:shadow-lg">
          <div>
            <div className="bg-primary text-primary-foreground mb-6 flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold">
              1
            </div>
            <h3 className="text-foreground mb-3 text-xl font-bold">
              Inscription rapide
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Créez votre compte en quelques clics et configurez votre commerce
              en toute simplicité.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="text-primary group mt-8 inline-flex items-center text-sm font-bold hover:underline"
          >
            Créer mon compte{" "}
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Step 2 */}
        <div className="border-border bg-background flex flex-col justify-between rounded-3xl border p-8 transition-shadow hover:shadow-lg">
          <div>
            <div className="bg-primary text-primary-foreground mb-6 flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold">
              2
            </div>
            <h3 className="text-foreground mb-3 text-xl font-bold">
              Personnalisez votre carte
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Définissez votre nombre de tampons, l&apos;intitulé de la
              récompense et vos couleurs de marque.
            </p>
          </div>
          <a
            href="#fonctionnalites"
            className="text-primary group mt-8 inline-flex items-center text-sm font-bold hover:underline"
          >
            Voir les options{" "}
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Step 3 */}
        <div className="border-border bg-background flex flex-col justify-between rounded-3xl border p-8 transition-shadow hover:shadow-lg">
          <div>
            <div className="bg-primary text-primary-foreground mb-6 flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold">
              3
            </div>
            <h3 className="text-foreground mb-3 text-xl font-bold">
              Lancez et fidélisez
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Affichez votre QR code en caisse. Scannez le téléphone du client
              pour valider chaque passage.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="text-primary group mt-8 inline-flex items-center text-sm font-bold hover:underline"
          >
            Commencer maintenant{" "}
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);
