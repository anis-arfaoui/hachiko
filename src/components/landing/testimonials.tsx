export const LandingTestimonials = () => (
  <section id="avis" className="bg-card py-20 lg:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <div className="bg-primary/10 text-primary mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
          ILS NOUS FONT CONFIANCE
        </div>
        <h2 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
          Des commerçants comme vous <br />
          qui ont déjà choisi Walaa.
        </h2>
        <p className="text-muted-foreground mt-4 text-sm sm:text-base">
          Rejoignez les commerces locaux qui augmentent leur chiffre
          d&apos;affaires grâce à la fidélité digitale.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Testimonial 1 */}
        <div className="border-border bg-background flex flex-col justify-between rounded-3xl border p-8">
          <div>
            <div className="text-primary mb-4 flex text-sm">★★★★★</div>
            <p className="text-foreground text-sm leading-relaxed italic">
              &ldquo;Depuis qu&apos;on utilise Walaa, on a vu une vraie
              différence. Nos clients adorent ne plus avoir à chercher une carte
              papier perdue dans leur portefeuille.&rdquo;
            </p>
          </div>
          <div className="border-border mt-8 flex items-center gap-3 border-t pt-6">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
              S
            </div>
            <div>
              <h4 className="text-foreground text-xs font-bold">Sofia B.</h4>
              <p className="text-muted-foreground text-xs">
                Propriétaire - Café Lina
              </p>
            </div>
          </div>
        </div>

        {/* Testimonial 2 */}
        <div className="border-border bg-background flex flex-col justify-between rounded-3xl border p-8">
          <div>
            <div className="text-primary mb-4 flex text-sm">★★★★★</div>
            <p className="text-foreground text-sm leading-relaxed italic">
              &ldquo;C&apos;est d&apos;une simplicité redoutable. En caisse, mes
              employés scannent le téléphone du client en deux secondes, et le
              client repart ravi.&rdquo;
            </p>
          </div>
          <div className="border-border mt-8 flex items-center gap-3 border-t pt-6">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
              M
            </div>
            <div>
              <h4 className="text-foreground text-xs font-bold">Mehdi T.</h4>
              <p className="text-muted-foreground text-xs">
                Gérant - La Boutique
              </p>
            </div>
          </div>
        </div>

        {/* Testimonial 3 */}
        <div className="border-border bg-background flex flex-col justify-between rounded-3xl border p-8">
          <div>
            <div className="text-primary mb-4 flex text-sm">★★★★★</div>
            <p className="text-foreground text-sm leading-relaxed italic">
              &ldquo;Une solution parfaite pour fidéliser nos clients sans prise
              de tête. Les résultats se voient dès les premières semaines avec
              un taux de retour en nette hausse.&rdquo;
            </p>
          </div>
          <div className="border-border mt-8 flex items-center gap-3 border-t pt-6">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
              N
            </div>
            <div>
              <h4 className="text-foreground text-xs font-bold">Nadia K.</h4>
              <p className="text-muted-foreground text-xs">
                Fondatrice - Beauty & Co
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
