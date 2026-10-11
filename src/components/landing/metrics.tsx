import { Clock, Smartphone, TrendingUp, Users } from "lucide-react";

export const LandingMetrics = () => (
  <section className="border-border bg-card border-y py-12">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-foreground text-3xl font-extrabold tracking-tight lg:text-4xl">
              +42%
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-snug sm:text-sm">
              de fréquentation en moyenne chez nos partenaires.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <div className="text-foreground text-3xl font-extrabold tracking-tight lg:text-4xl">
              100%
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-snug sm:text-sm">
              des cartes sur mobile sans matériel additionnel.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-foreground text-3xl font-extrabold tracking-tight lg:text-4xl">
              3x
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-snug sm:text-sm">
              plus de visites chez les clients fidèles.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-foreground text-3xl font-extrabold tracking-tight lg:text-4xl">
              &lt; 5 Min
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-snug sm:text-sm">
              pour lancer votre programme de fidélité.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
