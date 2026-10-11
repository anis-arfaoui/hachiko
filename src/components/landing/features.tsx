import {
  BarChart3,
  Gift,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";

export const LandingFeatures = () => (
  <section id="fonctionnalites" className="bg-muted/40 py-20 lg:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <div className="bg-primary/10 text-primary mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
          TOUT CE DONT VOUS AVEZ BESOIN
        </div>
        <h2 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tout ce qu&apos;il vous faut pour transformer <br />
          <span className="text-primary">
            des visiteurs en clients fidèles.
          </span>
        </h2>
        <p className="text-muted-foreground mt-4 text-sm sm:text-base">
          Des fonctionnalités pensées pour simplifier votre quotidien et
          maximiser votre impact commercial.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Feature 1 */}
        <div className="border-border bg-card rounded-3xl border p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Gift className="h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-bold">
            Récompenses flexibles
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Offrez des réductions, des produits offerts ou des avantages
            exclusifs selon les paliers de tampons que vous fixez.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="border-border bg-card rounded-3xl border p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-2xl">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-bold">
            Fidélisation instantanée
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vos clients s&apos;inscrivent avec leur numéro de téléphone en 15
            secondes sans formulaire complexe.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="border-border bg-card rounded-3xl border p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-2xl">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-bold">
            Suivi en temps réel
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Analysez vos résultats : nombre total de clients, tampons distribués
            et cadeaux validés sur votre tableau de bord.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="border-border bg-card rounded-3xl border p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Smartphone className="h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-bold">
            100% mobile & PWA
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vos clients ajoutent instantanément la carte à leur écran
            d&apos;accueil smartphone sans rien télécharger depuis le Play Store
            ou l&apos;App Store.
          </p>
        </div>

        {/* Feature 5 */}
        <div className="border-border bg-card rounded-3xl border p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-bold">
            Scanner ultra-rapide
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            La caméra de caisse scanne le QR code du client en moins de 2
            secondes avec signal sonore et confirmation haptique.
          </p>
        </div>

        {/* Feature 6 */}
        <div className="border-border bg-card rounded-3xl border p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-bold">
            Sécurisé & Anti-Fraude
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Protection anti-double scan avec temporisation automatique (cooldown
            de 3 min) et jetons cryptographiques uniques.
          </p>
        </div>
      </div>
    </div>
  </section>
);
