import { eq } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";

export interface EstablishmentDetails {
  activityType: string;
  address: string;
  city: string;
  description: string;
  name: string;
  phone: string;
  slug: string | null;
}

export interface StoredMetadata {
  activityType?: string;
  address?: string;
  city?: string;
  description?: string;
  phone?: string;
}

export const getEstablishmentDetails = async (
  organizationId: string
): Promise<EstablishmentDetails | null> => {
  const [org] = await db
    .select({
      id: organization.id,
      metadata: organization.metadata,
      name: organization.name,
      slug: organization.slug,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) {
    return null;
  }

  let parsed: StoredMetadata = {};
  if (org.metadata) {
    try {
      parsed = JSON.parse(org.metadata) as StoredMetadata;
    } catch {
      // ignore JSON parse error
    }
  }

  return {
    activityType:
      parsed.activityType ||
      "Commerce physique — mes clients viennent sur place",
    address: parsed.address || "",
    city: parsed.city || "",
    description: parsed.description || "",
    name: org.name,
    phone: parsed.phone || "",
    slug: org.slug || null,
  };
};

export const updateEstablishmentDetails = async (
  organizationId: string,
  details: {
    activityType?: string;
    address?: string;
    city?: string;
    description?: string;
    name: string;
    phone?: string;
  }
): Promise<EstablishmentDetails | null> => {
  const trimmedName = details.name.trim();

  // Read existing metadata to preserve any extra properties
  const [existingOrg] = await db
    .select({
      metadata: organization.metadata,
      slug: organization.slug,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  let existingMeta: StoredMetadata = {};
  if (existingOrg?.metadata) {
    try {
      existingMeta = JSON.parse(existingOrg.metadata) as StoredMetadata;
    } catch {
      // ignore
    }
  }

  const newMetadata: StoredMetadata = {
    ...existingMeta,
    activityType:
      details.activityType ??
      existingMeta.activityType ??
      "Commerce physique — mes clients viennent sur place",
    address: details.address?.trim() ?? existingMeta.address ?? "",
    city: details.city?.trim() ?? existingMeta.city ?? "",
    description: details.description?.trim() ?? existingMeta.description ?? "",
    phone: details.phone?.trim() ?? existingMeta.phone ?? "",
  };

  const [updated] = await db
    .update(organization)
    .set({
      metadata: JSON.stringify(newMetadata),
      name: trimmedName,
    })
    .where(eq(organization.id, organizationId))
    .returning();

  if (!updated) {
    return null;
  }

  return {
    activityType: newMetadata.activityType || "",
    address: newMetadata.address || "",
    city: newMetadata.city || "",
    description: newMetadata.description || "",
    name: updated.name,
    phone: newMetadata.phone || "",
    slug: updated.slug,
  };
};
