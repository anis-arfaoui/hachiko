import { and, eq, gte, lt } from "drizzle-orm";

import { db } from "@/db";
import {
  automations,
  cards,
  locations,
  notifications,
  programs,
} from "@/db/schema/loyalty";
import { broadcastAppleWalletNotification } from "@/lib/wallet/apple";
import { broadcastGoogleWalletNotification } from "@/lib/wallet/google";
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

const DEFAULT_LOCATION_MESSAGE = "Un café vous attend chez nous ☕";

/**
 * Parses geographic coordinates from a Google Maps URL, short link, or raw coordinate string.
 */
export const parseCoordinatesFromLocationInput = async (
  input: string
): Promise<{ latitude: string; longitude: string } | null> => {
  if (!input) {
    return null;
  }

  let text = input.trim();

  // If short link like maps.app.goo.gl or goo.gl/maps, follow redirect to expand full URL
  if (text.includes("goo.gl/") || text.includes("maps.app.goo.gl/")) {
    try {
      const response = await fetch(text, {
        method: "HEAD",
        redirect: "follow",
      });
      if (response.url) {
        text = response.url;
      }
    } catch (error) {
      console.warn(
        "[parseCoordinatesFromLocationInput] Error resolving short maps URL:",
        error instanceof Error ? error.message : error
      );
    }
  }

  // 1. Direct coordinates: "33.5731, -7.5898" or "33.5731 -7.5898"
  const directMatch = text
    .replaceAll(/[()]/gu, "")
    .match(/^(?<lat>-?\d+\.\d+)[,\s]+(?<lng>-?\d+\.\d+)$/u);
  if (directMatch?.groups?.lat && directMatch.groups.lng) {
    return {
      latitude: directMatch.groups.lat,
      longitude: directMatch.groups.lng,
    };
  }

  // 2. Google Maps exact pin protobuf coordinates: !3d33.5731!4d-7.5898
  const protoMatch = text.match(/!3d(?<lat>-?\d+\.\d+)!4d(?<lng>-?\d+\.\d+)/u);
  if (protoMatch?.groups?.lat && protoMatch.groups.lng) {
    return {
      latitude: protoMatch.groups.lat,
      longitude: protoMatch.groups.lng,
    };
  }

  // 3. Google Maps viewport @lat,lng format
  const atMatch = text.match(/@(?<lat>-?\d+\.\d+),(?<lng>-?\d+\.\d+)/u);
  if (atMatch?.groups?.lat && atMatch.groups.lng) {
    return {
      latitude: atMatch.groups.lat,
      longitude: atMatch.groups.lng,
    };
  }

  // 4. Google Maps URL query format: ?q=lat,lng or ?ll=lat,lng or ?query=lat,lng
  const qMatch = text.match(
    /[?&](?:q|query|ll)=(?<lat>-?\d+\.\d+),(?<lng>-?\d+\.\d+)/u
  );
  if (qMatch?.groups?.lat && qMatch.groups.lng) {
    return {
      latitude: qMatch.groups.lat,
      longitude: qMatch.groups.lng,
    };
  }

  return null;
};

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
    triggerValue: locationRow?.triggerValue ?? 100,
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
  let lat = input.latitude ? Number(input.latitude) : Number.NaN;
  let lng = input.longitude ? Number(input.longitude) : Number.NaN;

  if (
    input.type === "location_proximity" &&
    (Number.isNaN(lat) || Number.isNaN(lng)) &&
    input.placeId
  ) {
    const parsed = await parseCoordinatesFromLocationInput(input.placeId);
    if (parsed) {
      lat = Number(parsed.latitude);
      lng = Number(parsed.longitude);
      input.latitude = parsed.latitude;
      input.longitude = parsed.longitude;
    }
  }

  if (
    input.type === "location_proximity" &&
    !input.placeId?.trim() &&
    !input.latitude
  ) {
    input.latitude = null;
    input.longitude = null;
    lat = Number.NaN;
    lng = Number.NaN;
  }

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

export interface RunAutomationsResult {
  inactiveSent: number;
  message?: string;
  rewardSent: number;
  success: boolean;
}

/**
 * Checks and triggers active automated retention notifications for an organization:
 * 1. Inactive customers: haven't visited in X days.
 * 2. Approaching reward: within X points/stamps of unlocking their gift.
 */
export const runAutomationsForOrganization = async (
  organizationId: string
): Promise<RunAutomationsResult> => {
  const [config, programList] = await Promise.all([
    getAutomations(organizationId),
    db
      .select()
      .from(programs)
      .where(eq(programs.organizationId, organizationId))
      .limit(1),
  ]);

  const [prog] = programList;
  if (!prog) {
    return {
      inactiveSent: 0,
      message: "Programme introuvable",
      rewardSent: 0,
      success: false,
    };
  }

  let inactiveSent = 0;
  let rewardSent = 0;
  const now = new Date();

  // 1. Inactive customer relance
  if (config.inactiveClient.isEnabled) {
    const days = config.inactiveClient.triggerValue || 30;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const inactiveCards = await db
      .select({ id: cards.id })
      .from(cards)
      .where(
        and(eq(cards.programId, prog.id), lt(cards.updatedAt, cutoffDate))
      );

    if (inactiveCards.length > 0) {
      const cardIds = inactiveCards.map((c) => c.id);

      await Promise.allSettled([
        broadcastGoogleWalletNotification({
          body: config.inactiveClient.message,
          cardIds,
          header: "Relance fidélité",
          programId: prog.id,
        }),
        broadcastAppleWalletNotification(prog.id),
      ]);

      await db.insert(notifications).values({
        channel: "all",
        createdAt: now,
        id: crypto.randomUUID(),
        message: config.inactiveClient.message,
        organizationId,
        recipientCount: inactiveCards.length,
        sentAt: now,
        title: "Relance client inactif (Automatique)",
        type: "automated",
      });

      inactiveSent = inactiveCards.length;
    }
  }

  // 2. Approaching reward notification
  if (config.rewardProximity.isEnabled) {
    const threshold = config.rewardProximity.triggerValue || 20;
    const minBalance = Math.max(0, prog.stampsRequired - threshold);

    const rewardCards = await db
      .select({ id: cards.id })
      .from(cards)
      .where(
        and(
          eq(cards.programId, prog.id),
          gte(cards.balance, minBalance),
          lt(cards.balance, prog.stampsRequired)
        )
      );

    if (rewardCards.length > 0) {
      const cardIds = rewardCards.map((c) => c.id);

      await Promise.allSettled([
        broadcastGoogleWalletNotification({
          body: config.rewardProximity.message,
          cardIds,
          header: "Bientôt votre récompense !",
          programId: prog.id,
        }),
        broadcastAppleWalletNotification(prog.id),
      ]);

      await db.insert(notifications).values({
        channel: "all",
        createdAt: now,
        id: crypto.randomUUID(),
        message: config.rewardProximity.message,
        organizationId,
        recipientCount: rewardCards.length,
        sentAt: now,
        title: "Bientôt une récompense (Automatique)",
        type: "automated",
      });

      rewardSent = rewardCards.length;
    }
  }

  return {
    inactiveSent,
    rewardSent,
    success: true,
  };
};
