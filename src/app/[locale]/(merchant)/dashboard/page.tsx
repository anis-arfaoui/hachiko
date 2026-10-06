"use client";

import {
  ArrowRight,
  Check,
  Copy,
  Gift,
  QrCode,
  Stamp,
  Users,
} from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { getDashboardDataAction } from "@/app/actions/dashboard";
import { DashboardHowItWorks } from "@/components/dashboard/how-it-works";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { orgClient, useActiveOrganization } from "@/lib/auth-client";

interface DashboardStatsState {
  recentActivity: {
    amount: number;
    createdAt: Date;
    customerName: string;
    id: string;
    type: string;
  }[];
  totalCustomers: number;
  totalRewardsRedeemed: number;
  totalStamps: number;
}

interface ServerOrg {
  id: string;
  name: string;
  slug: string | null;
}

const getQrPlaceholder = (hasUrl: boolean, loading: boolean): string => {
  if (hasUrl) {
    return "Génération...";
  }
  if (loading) {
    return "Chargement...";
  }
  return "Non disponible";
};

const DashboardPage = () => {
  const locale = useLocale();
  const { data: activeOrg } = useActiveOrganization();

  const [serverOrg, setServerOrg] = useState<ServerOrg | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsState>({
    recentActivity: [],
    totalCustomers: 0,
    totalRewardsRedeemed: 0,
    totalStamps: 0,
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const effectiveOrg = activeOrg ?? serverOrg;
  const orgSlug = effectiveOrg?.slug || effectiveOrg?.id || "";
  const joinUrl =
    typeof window !== "undefined" && orgSlug
      ? `${window.location.origin}/${locale}/j/${orgSlug}`
      : "";

  useEffect(() => {
    const loadData = async () => {
      const data = await getDashboardDataAction();
      if (data) {
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.organization) {
          setServerOrg(data.organization);
          if (!activeOrg?.id) {
            orgClient.setActive({ organizationId: data.organization.id });
          }
        }
      }
      setIsInitialLoading(false);
    };
    loadData();
  }, [activeOrg?.id]);

  useEffect(() => {
    if (!joinUrl) {
      return;
    }

    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(joinUrl, {
          margin: 1,
          scale: 8,
          width: 200,
        });
        setQrCodeDataUrl(url);
      } catch {
        setQrCodeDataUrl(null);
      }
    };

    generateQr();
  }, [joinUrl]);

  const handleCopyLink = () => {
    if (!joinUrl) {
      return;
    }
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {effectiveOrg?.name ?? "Tableau de bord"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Aperçu de votre programme de fidélité et de vos clients.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/${locale}/dashboard/program`}
            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors"
          >
            Modifier programme
          </Link>
          <Link
            href={`/${locale}/till`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors"
          >
            <QrCode className="h-4 w-4" />
            <span>Scanner de caisse</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Clients Inscrits
              </p>
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Comptes clients créés pour votre commerce
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Tampons Distribués
              </p>
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Stamp className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStamps}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Visites validées par vos équipes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Cadeaux Offerts
              </p>
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Gift className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRewardsRedeemed}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Cartes complètes récompensées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Counter Join QR Code & Links */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>
              Pour le comptoir : QR code d&apos;adhésion client
            </CardTitle>
            <CardDescription>
              Affichez ou imprimez ce code à la caisse. Vos clients le scannent
              avec leur appareil photo pour rejoindre votre programme sans
              télécharger d&apos;application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-border bg-muted/30 flex flex-col items-center gap-6 rounded-xl border p-4 sm:flex-row">
                {qrCodeDataUrl ? (
                  <Image
                    src={qrCodeDataUrl}
                    alt="QR Code d'adhésion client"
                    width={144}
                    height={144}
                    unoptimized
                    className="border-border h-36 w-36 rounded-lg border bg-white p-2 shadow-sm"
                  />
                ) : (
                  <div className="border-border bg-card text-muted-foreground flex h-36 w-36 items-center justify-center rounded-lg border text-xs">
                    {getQrPlaceholder(Boolean(joinUrl), isInitialLoading)}
                  </div>
                )}

                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">
                      Lien direct d&apos;inscription
                    </h4>
                    <p className="text-muted-foreground text-xs break-all">
                      {joinUrl ||
                        (isInitialLoading
                          ? "Chargement..."
                          : "Aucun commerce configuré")}
                    </p>
                    {!isInitialLoading && !orgSlug && (
                      <Link
                        href={`/${locale}/sign-up`}
                        className="text-primary mt-1 inline-block text-xs font-medium hover:underline"
                      >
                        Configurer votre commerce →
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      <span className="flex items-center gap-1.5">
                        {copied ? (
                          <>
                            <Check className="text-primary h-3.5 w-3.5" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copier le lien</span>
                          </>
                        )}
                      </span>
                    </Button>

                    {joinUrl && (
                      <a
                        href={joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors"
                      >
                        <span>Tester le lien</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Instructions */}
        <DashboardHowItWorks />
      </div>
    </div>
  );
};

export default DashboardPage;
