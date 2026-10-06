import { ArrowRight, QrCode, Smartphone, Sparkles, Store } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

const CURRENT_YEAR = 2026;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const HomePage = async ({ params }: HomePageProps) => {
  const { locale } = await params;
  const t = await getTranslations("common");

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border bg-card/60 sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Store className="text-primary h-6 w-6" />
            <span>{t("appName")}</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href={`/${locale}/sign-in`}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Connexion
            </Link>
            <Link
              href={`/${locale}/sign-up`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors"
            >
              Créer mon programme
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
          <div className="border-border bg-muted text-muted-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Conçu spécialement pour les commerces en Algérie</span>
          </div>

          <h1 className="text-foreground text-4xl font-extrabold tracking-tight sm:text-6xl">
            La carte de fidélité digitale,{" "}
            <span className="text-primary underline decoration-2 underline-offset-8">
              simple et sans application
            </span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
            Vos clients reçoivent leur carte directement sur leur smartphone via
            un lien ou un QR code. Votre personnel valide les visites en un scan
            à la caisse.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${locale}/sign-up`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-8 text-base font-medium shadow-md transition-colors sm:w-auto"
            >
              <span>Démarrer maintenant</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/sign-in`}
              className="border-border bg-card text-foreground hover:bg-muted inline-flex h-12 w-full items-center justify-center rounded-lg border px-8 text-base font-medium transition-colors sm:w-auto"
            >
              Accéder à mon espace
            </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="border-border bg-muted/40 border-t py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
                <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Carte Web & PWA</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Aucun téléchargement sur le Play Store ou l&apos;App Store.
                  Vos clients ajoutent la carte à leur écran d&apos;accueil en
                  un clic.
                </p>
              </div>

              <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
                <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">
                  Scanner de caisse ultra rapide
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Utilisez l&apos;appareil photo du smartphone du personnel.
                  Tampon attribué en moins de 2 secondes avec protection
                  anti-fraude.
                </p>
              </div>

              <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
                <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Store className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">
                  Statistiques en direct
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Suivez le nombre de clients fidélisés, le volume de visites
                  quotidiennes et les récompenses distribuées.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-border text-muted-foreground border-t py-8 text-center text-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p>© {CURRENT_YEAR} Fidélité Digitale. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link
              href={`/${locale}/sign-in`}
              className="hover:text-foreground transition-colors"
            >
              Espace Commerçant
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
