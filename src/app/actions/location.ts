"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  createLocation,
  deleteLocation,
  getOrganizationLocations,
  updateLocation,
} from "@/dal/location";
import type { LocationItem } from "@/dal/location";
import { getMerchantSession } from "@/dal/merchant";
import { getProgramByOrganization } from "@/dal/program";
import { getRewardsByProgramId } from "@/dal/rewards";
import { getSubscriptionDetails } from "@/dal/subscription";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";

import type { OrganizationMetadata } from "./program";

const WHATSAPP_CONTACT_PHONE = "213796841801";

export interface CardPreviewData {
  bgImageUrl?: string | null;
  brandColor: string;
  businessName: string;
  locations: {
    address: string | null;
    city: string | null;
    id: string;
    isDefault: boolean;
    name: string;
    phone: string | null;
  }[];
  logoUrl: string | null;
  programType: "stamps" | "points";
  rewardLabel: string;
  rewards: {
    cost: number;
    description: string | null;
    id: string;
    label: string;
  }[];
  slug: string | null;
  stampsRequired: number;
}

export interface LocationsDataResult {
  allowedPointsOfSale: number;
  locations: LocationItem[];
  organizationName: string;
  plan: "starter" | "pro";
}

export const getLocationsAction =
  async (): Promise<LocationsDataResult | null> => {
    const session = await getMerchantSession();
    if (!session) {
      return null;
    }

    const [locs, subDetails] = await Promise.all([
      getOrganizationLocations(session.organizationId),
      getSubscriptionDetails(session.organizationId),
    ]);

    return {
      allowedPointsOfSale: subDetails?.subscription.pointsOfSale || 1,
      locations: locs,
      organizationName: subDetails?.organizationName || "Mon Commerce",
      plan: subDetails?.subscription.plan || "pro",
    };
  };

export const createLocationAction = async (data: {
  address?: string;
  city?: string;
  name: string;
  phone?: string;
}): Promise<{
  error?: string;
  location?: LocationItem;
  quotaExceeded?: boolean;
  success: boolean;
}> => {
  const session = await getMerchantSession();
  if (!session) {
    return { error: "Non autorisé", success: false };
  }

  const trimmedName = data.name.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return {
      error: "Le nom de la boutique doit contenir au moins 2 caractères.",
      success: false,
    };
  }

  // Check subscription quota
  const [existingLocs, subDetails] = await Promise.all([
    getOrganizationLocations(session.organizationId),
    getSubscriptionDetails(session.organizationId),
  ]);

  const activeCount = existingLocs.filter((l) => l.status === "active").length;
  const allowed = subDetails?.subscription.pointsOfSale || 1;

  if (activeCount >= allowed) {
    return {
      error:
        "Limite de points de vente atteinte pour votre formule actuelle (+2 500 DA/mois pour une boutique supplémentaire).",
      quotaExceeded: true,
      success: false,
    };
  }

  const newLoc = await createLocation(session.organizationId, {
    address: data.address,
    city: data.city,
    name: trimmedName,
    phone: data.phone,
    status: "active",
  });

  revalidatePath("/dashboard");
  revalidatePath("/caisses");
  revalidatePath("/settings");

  return { location: newLoc, success: true };
};

export const requestExtraLocationAction = async (data: {
  address?: string;
  city?: string;
  name: string;
  phone?: string;
}): Promise<{
  error?: string;
  location?: LocationItem;
  success: boolean;
  whatsAppUrl?: string;
}> => {
  const session = await getMerchantSession();
  if (!session) {
    return { error: "Non autorisé", success: false };
  }

  const trimmedName = data.name.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return {
      error: "Le nom de la boutique doit contenir au moins 2 caractères.",
      success: false,
    };
  }

  // Create as pending location and fetch org name concurrently
  const [pendingLoc, subDetails] = await Promise.all([
    createLocation(session.organizationId, {
      address: data.address,
      city: data.city,
      name: trimmedName,
      phone: data.phone,
      status: "pending",
    }),
    getSubscriptionDetails(session.organizationId),
  ]);
  const orgName = subDetails?.organizationName || "Mon Commerce";

  const messageText = encodeURIComponent(
    `Bonjour Walaa 👋,\n\n` +
      `Je souhaite ajouter une boutique supplémentaire pour mon établissement *${orgName}*.\n\n` +
      `• Nouvelle boutique : *${trimmedName}*\n` +
      `• Adresse : *${data.address?.trim() || "Non spécifiée"}*\n` +
      `• Ville : *${data.city?.trim() || "Non spécifiée"}*\n` +
      `• Supplément mensuel : *2 500 DA / mois*\n\n` +
      `Pouvez-vous me transmettre les coordonnées BaridiMob / CCP pour valider l'activation de ce point de vente ? Merci !`
  );

  const whatsAppUrl = `https://wa.me/${WHATSAPP_CONTACT_PHONE}?text=${messageText}`;

  revalidatePath("/dashboard");
  revalidatePath("/caisses");
  revalidatePath("/settings");

  return {
    location: pendingLoc,
    success: true,
    whatsAppUrl,
  };
};

export const updateLocationAction = async (
  locationId: string,
  data: {
    address?: string;
    city?: string;
    name?: string;
    phone?: string;
  }
): Promise<{
  error?: string;
  location?: LocationItem;
  success: boolean;
}> => {
  const session = await getMerchantSession();
  if (!session) {
    return { error: "Non autorisé", success: false };
  }

  const updated = await updateLocation(
    session.organizationId,
    locationId,
    data
  );
  if (!updated) {
    return { error: "Boutique introuvable", success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/caisses");
  revalidatePath("/settings");

  return { location: updated, success: true };
};

export const deleteLocationAction = async (
  locationId: string
): Promise<{ error?: string; success: boolean }> => {
  const session = await getMerchantSession();
  if (!session) {
    return { error: "Non autorisé", success: false };
  }

  const res = await deleteLocation(session.organizationId, locationId);

  revalidatePath("/dashboard");
  revalidatePath("/caisses");
  revalidatePath("/settings");

  return res;
};

export const getClientCardPreviewDataAction =
  async (): Promise<CardPreviewData | null> => {
    const session = await getMerchantSession();
    if (!session) {
      return null;
    }

    const [program, orgList, locs] = await Promise.all([
      getProgramByOrganization(session.organizationId),
      db
        .select({
          id: organization.id,
          logo: organization.logo,
          metadata: organization.metadata,
          name: organization.name,
          slug: organization.slug,
        })
        .from(organization)
        .where(eq(organization.id, session.organizationId))
        .limit(1),
      getOrganizationLocations(session.organizationId),
    ]);

    const [currentOrg] = orgList;
    if (!currentOrg) {
      return null;
    }

    let metadataObj: OrganizationMetadata = {};
    if (currentOrg.metadata) {
      try {
        metadataObj = JSON.parse(currentOrg.metadata) as OrganizationMetadata;
      } catch {
        metadataObj = {};
      }
    }

    const { bgImageUrl = null } = metadataObj;

    let rewardItems: {
      cost: number;
      description: string | null;
      id: string;
      label: string;
    }[] = [];

    if (program?.id) {
      const fetchedRewards = await getRewardsByProgramId(program.id);
      rewardItems = fetchedRewards.map((r) => ({
        cost: r.cost,
        description: r.description,
        id: r.id,
        label: r.label,
      }));
    }

    return {
      bgImageUrl,
      brandColor: program?.brandColor || "#18181b",
      businessName: currentOrg.name,
      locations: locs.map((l) => ({
        address: l.address,
        city: l.city,
        id: l.id,
        isDefault: l.isDefault,
        name: l.name,
        phone: l.phone,
      })),
      logoUrl: program?.logoUrl || currentOrg.logo || null,
      programType: (program?.type as "stamps" | "points") || "stamps",
      rewardLabel: program?.rewardLabel || "1 Récompense offerte",
      rewards: rewardItems,
      slug: currentOrg.slug,
      stampsRequired: program?.stampsRequired || 10,
    };
  };
