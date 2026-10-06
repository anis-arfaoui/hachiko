import {
  CheckCircle2,
  Gift,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "processing" }
  | {
      balance: number;
      isDuplicate: boolean;
      rewardReady: boolean;
      stampsRequired: number;
      status: "success";
      token: string;
    }
  | {
      remainingSeconds: number;
      status: "cooldown";
    }
  | {
      message: string;
      status: "error";
    }
  | {
      rewardLabel: string;
      status: "redeemed";
    };

interface ScanFeedbackProps {
  onRedeem: (token: string) => void;
  onScanNext: () => void;
  scanState: ScanState;
}

export const ScanFeedback = ({
  onRedeem,
  onScanNext,
  scanState,
}: ScanFeedbackProps) => {
  if (scanState.status === "success") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-5 w-5" />
            <CardTitle>Tampon validé avec succès !</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-card border-border flex items-center justify-between rounded-xl border p-3">
              <span className="text-muted-foreground text-sm">
                Solde actuel de la carte :
              </span>
              <span className="text-primary text-lg font-extrabold">
                {scanState.balance} / {scanState.stampsRequired}
              </span>
            </div>

            {scanState.rewardReady ? (
              <div className="bg-primary text-primary-foreground space-y-3 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Sparkles className="h-4 w-4" />
                  <span>Carte complète ! Récompense prête</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  Le client a complété ses {scanState.stampsRequired} tampons.
                  Donnez-lui sa récompense puis validez ci-dessous.
                </p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => onRedeem(scanState.token)}
                >
                  <Gift className="mr-2 h-4 w-4" />
                  <span>Donner la récompense & Réinitialiser</span>
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={onScanNext}>
                <span>Scanner le client suivant</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scanState.status === "cooldown") {
    return (
      <Card>
        <CardHeader>
          <div className="text-destructive flex items-center gap-2">
            <TriangleAlert className="h-5 w-5" />
            <CardTitle>Client déjà scanné récemment</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Pour éviter les doubles-tampons accidentels, un délai de sécurité
              est actif. Veuillez patienter environ{" "}
              <strong>{scanState.remainingSeconds} secondes</strong> avant de
              scanner à nouveau cette carte.
            </p>
            <Button variant="outline" className="w-full" onClick={onScanNext}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              <span>Réessayer ou scanner un autre client</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scanState.status === "redeemed") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="text-primary h-5 w-5" />
            <CardTitle>Récompense offerte avec succès !</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Cadeau validé : <strong>{scanState.rewardLabel}</strong>. La carte
              du client a été réinitialisée à 0 tampon pour son prochain cycle
              de fidélité.
            </p>
            <Button className="w-full" onClick={onScanNext}>
              <span>Prêt pour le client suivant</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scanState.status === "error") {
    return (
      <Card>
        <CardHeader>
          <div className="text-destructive flex items-center gap-2">
            <TriangleAlert className="h-5 w-5" />
            <CardTitle>Erreur lors du scan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground text-xs">{scanState.message}</p>
            <Button variant="outline" className="w-full" onClick={onScanNext}>
              <span>Réessayer</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
