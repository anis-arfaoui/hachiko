import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const DashboardHowItWorks = () => (
  <Card className="lg:col-span-5">
    <CardHeader>
      <CardTitle>Comment ça marche</CardTitle>
      <CardDescription>Les 3 étapes clés pour votre commerce</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            1
          </span>
          <div>
            <h5 className="text-sm font-semibold">Le client rejoint</h5>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              Le client scanne le QR code du comptoir, entre son nom et son
              téléphone, et obtient sa carte de fidélité.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            2
          </span>
          <div>
            <h5 className="text-sm font-semibold">La caisse scanne</h5>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              Le personnel ouvre le scanner de caisse sur son smartphone et
              flashe le QR code du client pour valider le tampon.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            3
          </span>
          <div>
            <h5 className="text-sm font-semibold">Le cadeau est débloqué</h5>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              Une fois la carte pleine, le scanner propose de valider le cadeau
              et réinitialise automatiquement la carte pour le cycle suivant.
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
