import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { automations, locations, programs } from "@/db/schema/loyalty";
import { broadcastAppleWalletNotification } from "@/lib/wallet/apple";
import { updateLoyaltyClassLocations } from "@/lib/wallet/google/class";

export type AutomationType =
  | "inactive_client"
  | "reward_proximity"
  | "location_proximity";

export interface AutomationItem {
  address?: string | null;
  createdAt?: Date;
  id?: string;
  isEnabled: boolean;
  latitude?: string | null;
  longitude?: string | null;
  message: string;
  organizationId: string;
  placeId?: string | null;
  triggerValue: number;
  type: AutomationType;
  updatedAt?: Date;
}

export interface AutomationsConfig {
  inactiveClient: AutomationItem;
  locationProximity: AutomationItem;
  rewardProximity: AutomationItem;
}

export interface SaveAutomationInput {
  address?: string | null;
  isEnabled: boolean;
  latitude?: string | null;
  longitude?: string | null;
  message: string;
  placeId?: string | null;
  triggerValue: number;
  type: AutomationType;
}

const DEFAULT_INACTIVE_MESSAGE =
  "Cela fait un moment ! Revenez profiter de vos avantages fidélité. 😊";

const DEFAULT_REWARD_MESSAGE =
  "Plus que quelques points pour débloquer votre récompense chez nous ! 🎁";

const DEFAULT_LOCATION_MESSAGE =
  "Vous êtes à deux pas de notre établissement ! Venez nous rendre visite. 📍";

/**
 * Retrieves all 3 marketing & retention automations for an organization.
 * Supplies optimized defaults for any not yet configured in the database.
 */
export const getAutomations = async (
  organizationId: string
): Promise<AutomationsConfig> => {
  const [existingRows, defaultLocList] = await Promise.all([
    db
      .select()
      .from(automations)
      .where(eq(automations.organizationId, organizationId)),
    db
      .select({ address: locations.address })
      .from(locations)
      .where(eq(locations.organizationId, organizationId))
      .limit(1),
  ]);

  const defaultAddress = defaultLocList[0]?.address ?? null;

  const inactiveRow = existingRows.find((r) => r.type === "inactive_client");
  const rewardRow = existingRows.find((r) => r.type === "reward_proximity");
  const locationRow = existingRows.find((r) => r.type === "location_proximity");

  const inactiveClient: AutomationItem = {
    createdAt: inactiveRow?.createdAt,
    id: inactiveRow?.id,
    isEnabled: inactiveRow?.isEnabled ?? false,
    message: inactiveRow?.message ?? DEFAULT_INACTIVE_MESSAGE,
    organizationId,
    triggerValue: inactiveRow?.triggerValue ?? 30,
    type: "inactive_client",
    updatedAt: inactiveRow?.updatedAt,
  };

  const rewardProximity: AutomationItem = {
    createdAt: rewardRow?.createdAt,
    id: rewardRow?.id,
    isEnabled: rewardRow?.isEnabled ?? false,
    message: rewardRow?.message ?? DEFAULT_REWARD_MESSAGE,
    organizationId,
    triggerValue: rewardRow?.triggerValue ?? 20,
    type: "reward_proximity",
    updatedAt: rewardRow?.updatedAt,
  };

  const locationProximity: AutomationItem = {
    address: locationRow?.address ?? defaultAddress,
    createdAt: locationRow?.createdAt,
    id: locationRow?.id,
    isEnabled: locationRow?.isEnabled ?? false,
    latitude: locationRow?.latitude ?? null,
    longitude: locationRow?.longitude ?? null,
    message: locationRow?.message ?? DEFAULT_LOCATION_MESSAGE,
    organizationId,
    placeId: locationRow?.placeId ?? null,
    triggerValue: locationRow?.triggerValue ?? 200,
    type: "location_proximity",
    updatedAt: locationRow?.updatedAt,
  };

  return {
    inactiveClient,
    locationProximity,
    rewardProximity,
  };
};

/**
 * Upserts an automation configuration and automatically synchronizes
 * Apple Wallet & Google Wallet geofencing for location-based alerts.
 */
export const saveAutomation = async (
  organizationId: string,
  input: SaveAutomationInput
): Promise<AutomationItem> => {
  const [existing] = await db
    .select({ id: automations.id })
    .from(automations)
    .where(
      and(
        eq(automations.organizationId, organizationId),
        eq(automations.type, input.type)
      )
    )
    .limit(1);

  let savedItem: AutomationItem;

  if (existing) {
    const [updated] = await db
      .update(automations)
      .set({
        address: input.address ?? null,
        isEnabled: input.isEnabled,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        message: input.message,
        placeId: input.placeId ?? null,
        triggerValue: input.triggerValue,
        updatedAt: new Date(),
      })
      .where(eq(automations.id, existing.id))
      .returning();

    savedItem = {
      ...updated,
      type: updated.type as AutomationType,
    };
  } else {
    const [inserted] = await db
      .insert(automations)
      .values({
        address: input.address ?? null,
        id: crypto.randomUUID(),
        isEnabled: input.isEnabled,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        message: input.message,
        organizationId,
        placeId: input.placeId ?? null,
        triggerValue: input.triggerValue,
        type: input.type,
      })
      .returning();

    savedItem = {
      ...inserted,
      type: inserted.type as AutomationType,
    };
  }

  // If location proximity is saved, update Google Wallet class and ping Apple Wallet passes
  if (input.type === "location_proximity") {
    const [program] = await db
      .select({ id: programs.id })
      .from(programs)
      .where(eq(programs.organizationId, organizationId))
      .limit(1);

    if (program) {
      const lat = input.latitude ? Number(input.latitude) : Number.NaN;
      const lng = input.longitude ? Number(input.longitude) : Number.NaN;

      const hasValidCoords =
        input.isEnabled && !Number.isNaN(lat) && !Number.isNaN(lng);

      const targetLocations = hasValidCoords
        ? [{ latitude: lat, longitude: lng }]
        : [];

      await Promise.allSettled([
        updateLoyaltyClassLocations(program.id, targetLocations),
        broadcastAppleWalletNotification(program.id),
      ]);
    }
  }

  return savedItem;
};

/**
 * Returns active geofencing coordinates & notification message for an organization,
 * used when generating Apple Wallet & Google Wallet passes.
 */
export const getActiveLocationGeofence = async (
  organizationId: string
): Promise<{
  latitude: number;
  longitude: number;
  relevantText?: string;
} | null> => {
  const [row] = await db
    .select({
      isEnabled: automations.isEnabled,
      latitude: automations.latitude,
      longitude: automations.longitude,
      message: automations.message,
    })
    .from(automations)
    .where(
      and(
        eq(automations.organizationId, organizationId),
        eq(automations.type, "location_proximity"),
        eq(automations.isEnabled, true)
      )
    )
    .limit(1);

  if (!row?.latitude || !row.longitude) {
    return null;
  }

  const lat = Number(row.latitude);
  const lng = Number(row.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lng,
    relevantText: row.message || undefined,
  };
};
