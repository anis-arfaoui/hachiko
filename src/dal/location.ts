import { and, count, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { cashiers, locations } from "@/db/schema/loyalty";

export interface LocationItem {
  address: string | null;
  cashierCount?: number;
  city: string | null;
  createdAt: Date;
  id: string;
  isDefault: boolean;
  name: string;
  organizationId: string;
  phone: string | null;
  status: "active" | "pending";
  updatedAt: Date;
}

interface StoredMetadata {
  activityType?: string;
  address?: string;
  city?: string;
  description?: string;
  phone?: string;
}

/**
 * Ensures that an organization has at least one default store (Boutique Principale).
 * Automatically seeds it using the establishment details saved during signup/settings.
 */
export const ensureDefaultLocation = async (
  organizationId: string
): Promise<LocationItem> => {
  const existingLocations = await db
    .select()
    .from(locations)
    .where(eq(locations.organizationId, organizationId))
    .limit(1);

  if (existingLocations.length > 0) {
    const [loc] = existingLocations;
    return {
      ...loc,
      status: (loc.status as "active" | "pending") || "active",
    };
  }

  // No store found: fetch establishment info from organization
  const [org] = await db
    .select({
      id: organization.id,
      metadata: organization.metadata,
      name: organization.name,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  let meta: StoredMetadata = {};
  if (org?.metadata) {
    try {
      meta = JSON.parse(org.metadata) as StoredMetadata;
    } catch {
      // ignore
    }
  }

  const newLocationId = crypto.randomUUID();
  const locationName = org?.name
    ? `${org.name} - Siège`
    : "Boutique Principale";

  const [created] = await db
    .insert(locations)
    .values({
      address: meta.address?.trim() || null,
      city: meta.city?.trim() || null,
      id: newLocationId,
      isDefault: true,
      name: locationName,
      organizationId,
      phone: meta.phone?.trim() || null,
      status: "active",
    })
    .returning();

  // Link any legacy unassigned cashiers to this default store
  await db
    .update(cashiers)
    .set({ locationId: newLocationId })
    .where(
      and(
        eq(cashiers.organizationId, organizationId),
        isNull(cashiers.locationId)
      )
    );

  return {
    ...created,
    status: (created.status as "active" | "pending") || "active",
  };
};

/**
 * Fetches all stores for an organization with active cashier counts.
 */
export const getOrganizationLocations = async (
  organizationId: string
): Promise<LocationItem[]> => {
  // Ensure primary store exists
  await ensureDefaultLocation(organizationId);

  const [locs, cashierCounts] = await Promise.all([
    db
      .select({
        address: locations.address,
        city: locations.city,
        createdAt: locations.createdAt,
        id: locations.id,
        isDefault: locations.isDefault,
        name: locations.name,
        organizationId: locations.organizationId,
        phone: locations.phone,
        status: locations.status,
        updatedAt: locations.updatedAt,
      })
      .from(locations)
      .where(eq(locations.organizationId, organizationId))
      .orderBy(locations.createdAt),
    db
      .select({
        count: count(cashiers.id),
        locationId: cashiers.locationId,
      })
      .from(cashiers)
      .where(eq(cashiers.organizationId, organizationId))
      .groupBy(cashiers.locationId),
  ]);

  const countMap = new Map<string, number>();
  for (const row of cashierCounts) {
    if (row.locationId) {
      countMap.set(row.locationId, Number(row.count));
    }
  }

  return locs.map((l) => ({
    ...l,
    cashierCount: countMap.get(l.id) || 0,
    status: (l.status as "active" | "pending") || "active",
  }));
};

/**
 * Creates a new store for an organization.
 */
export const createLocation = async (
  organizationId: string,
  data: {
    address?: string;
    city?: string;
    name: string;
    phone?: string;
    status?: "active" | "pending";
  }
): Promise<LocationItem> => {
  const [created] = await db
    .insert(locations)
    .values({
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      id: crypto.randomUUID(),
      isDefault: false,
      name: data.name.trim(),
      organizationId,
      phone: data.phone?.trim() || null,
      status: data.status || "active",
    })
    .returning();

  return {
    ...created,
    cashierCount: 0,
    status: (created.status as "active" | "pending") || "active",
  };
};

/**
 * Updates store details.
 */
interface LocationUpdatePayload {
  address?: string | null;
  city?: string | null;
  name?: string;
  phone?: string | null;
  updatedAt: Date;
}

export const updateLocation = async (
  organizationId: string,
  locationId: string,
  data: {
    address?: string;
    city?: string;
    name?: string;
    phone?: string;
  }
): Promise<LocationItem | null> => {
  const updatePayload: LocationUpdatePayload = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    updatePayload.name = data.name.trim();
  }
  if (data.address !== undefined) {
    updatePayload.address = data.address.trim() || null;
  }
  if (data.city !== undefined) {
    updatePayload.city = data.city.trim() || null;
  }
  if (data.phone !== undefined) {
    updatePayload.phone = data.phone.trim() || null;
  }

  const [updated] = await db
    .update(locations)
    .set(updatePayload)
    .where(
      and(
        eq(locations.id, locationId),
        eq(locations.organizationId, organizationId)
      )
    )
    .returning();

  if (!updated) {
    return null;
  }

  return {
    ...updated,
    status: (updated.status as "active" | "pending") || "active",
  };
};

/**
 * Deletes a store (cannot delete default store).
 */
export const deleteLocation = async (
  organizationId: string,
  locationId: string
): Promise<{ error?: string; success: boolean }> => {
  const [loc] = await db
    .select()
    .from(locations)
    .where(
      and(
        eq(locations.id, locationId),
        eq(locations.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!loc) {
    return { error: "Boutique introuvable.", success: false };
  }

  if (loc.isDefault) {
    return {
      error: "Impossible de supprimer la boutique principale.",
      success: false,
    };
  }

  // Unlink cashiers attached to this store
  await db
    .update(cashiers)
    .set({ locationId: null })
    .where(
      and(
        eq(cashiers.organizationId, organizationId),
        eq(cashiers.locationId, locationId)
      )
    );

  await db
    .delete(locations)
    .where(
      and(
        eq(locations.id, locationId),
        eq(locations.organizationId, organizationId)
      )
    );

  return { success: true };
};
