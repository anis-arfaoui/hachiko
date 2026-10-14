import { redirect } from "next/navigation";

import { LandingFeatures } from "@/components/landing/features";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { LandingMetrics } from "@/components/landing/metrics";
import { LandingPricing } from "@/components/landing/pricing";
import { WalaaRoiCalculator } from "@/components/landing/roi-calculator";
import { LandingSteps } from "@/components/landing/steps";
import { LandingTestimonials } from "@/components/landing/testimonials";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const HomePage = async ({ params }: HomePageProps) => {
  const [{ locale }, merchantSession] = await Promise.all([
    params,
    getMerchantSession(),
  ]);

  if (merchantSession) {
    const program = await getProgramByOrganization(
      merchantSession.organizationId
    );
    if (!program) {
      redirect(`/${locale}/onboarding`);
    }
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans antialiased">
      <LandingHeader locale={locale} />
      <LandingHero locale={locale} />
      <LandingMetrics />

      {/* ROI Calculator Section */}
      <section id="calculateur" className="bg-muted/40 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="bg-primary/10 text-primary mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
              UNE SOLUTION SIMPLE ET PUISSANTE
            </div>
            <h2 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
              Découvrez combien vous{" "}
              <span className="text-primary">pouvez gagner</span> avec Walaa.
            </h2>
            <p className="text-muted-foreground mt-4 text-sm sm:text-base">
              Adaptez le système de fidélité à votre activité et commencez à
              voir les résultats dès les premiers jours.
            </p>
          </div>

          <WalaaRoiCalculator locale={locale} />
        </div>
      </section>

      <LandingSteps locale={locale} />
      <LandingFeatures />
      <LandingTestimonials />

      {/* Dark Transition Container: Pricing, Final CTA, Footer */}
      <div className="dark-curve-shape bg-navy relative pt-20 text-white">
        <LandingPricing locale={locale} />
        <LandingFooter locale={locale} />
      </div>
    </div>
  );
};

export default HomePage;
