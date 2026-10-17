import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { customers } from "@/db/schema/loyalty";

export interface SubscriptionInfo {
  activatedAt?: string | null;
  billingCycle: "mensuel" | "semestriel" | "annuel";
  expiresAt?: string | null;
  hasNfcPlaque: boolean;
  plan: "starter" | "pro";
  pointsOfSale: number;
  // Price in Algerian Dinars (DZD)
  price: number;
  requestedAt?: string | null;
  status: "trial" | "pending" | "active" | "expired";
}

export interface SubscriptionDetails {
  customerCount: number;
  maxFreeCustomers: number;
  organizationName: string;
  organizationSlug: string | null;
  subscription: SubscriptionInfo;
}

interface OrganizationMetadataWithSub {
  activityType?: string;
  address?: string;
  city?: string;
  description?: string;
  phone?: string;
  stampIcon?: string;
  subscription?: SubscriptionInfo;
}

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  activatedAt: null,
  billingCycle: "mensuel",
  expiresAt: null,
  hasNfcPlaque: false,
  plan: "pro",
  pointsOfSale: 1,
  price: 4900,
  requestedAt: null,
  status: "trial",
};

export const getSubscriptionDetails = async (
  organizationId: string
): Promise<SubscriptionDetails | null> => {
  // 1. Fetch Organization info
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

  // 2. Fetch Customer count
  const [customerCountResult] = await db
    .select({
      value: count(customers.id),
    })
    .from(customers)
    .where(eq(customers.organizationId, organizationId));

  const customerCount = customerCountResult?.value || 0;

  // 3. Parse Metadata
  let parsedMetadata: OrganizationMetadataWithSub = {};
  if (org.metadata) {
    try {
      parsedMetadata = JSON.parse(org.metadata) as OrganizationMetadataWithSub;
    } catch {
      // ignore
    }
  }

  const subscription: SubscriptionInfo = parsedMetadata.subscription
    ? {
        ...DEFAULT_SUBSCRIPTION,
        ...parsedMetadata.subscription,
      }
    : DEFAULT_SUBSCRIPTION;

  return {
    customerCount,
    maxFreeCustomers: 30,
    organizationName: org.name,
    organizationSlug: org.slug,
    subscription,
  };
};

export const requestSubscription = async (
  organizationId: string,
  input: {
    billingCycle: "mensuel" | "semestriel" | "annuel";
    hasNfcPlaque: boolean;
    plan: "starter" | "pro";
    pointsOfSale: number;
    price: number;
  }
): Promise<SubscriptionInfo | null> => {
  const [org] = await db
    .select({
      metadata: organization.metadata,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) {
    return null;
  }

  let parsedMetadata: OrganizationMetadataWithSub = {};
  if (org.metadata) {
    try {
      parsedMetadata = JSON.parse(org.metadata) as OrganizationMetadataWithSub;
    } catch {
      // ignore
    }
  }

  const updatedSubscription: SubscriptionInfo = {
    ...DEFAULT_SUBSCRIPTION,
    ...parsedMetadata.subscription,
    billingCycle: input.billingCycle,
    hasNfcPlaque: input.hasNfcPlaque,
    plan: input.plan,
    pointsOfSale: Math.max(1, input.pointsOfSale),
    price: input.price,
    requestedAt: new Date().toISOString(),
    status: "pending",
  };

  parsedMetadata.subscription = updatedSubscription;

  await db
    .update(organization)
    .set({
      metadata: JSON.stringify(parsedMetadata),
    })
    .where(eq(organization.id, organizationId));

  return updatedSubscription;
};

export const setSubscriptionStatus = async (
  organizationId: string,
  status: "trial" | "pending" | "active" | "expired",
  durationMonths = 1
): Promise<SubscriptionInfo | null> => {
  const [org] = await db
    .select({
      metadata: organization.metadata,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) {
    return null;
  }

  let parsedMetadata: OrganizationMetadataWithSub = {};
  if (org.metadata) {
    try {
      parsedMetadata = JSON.parse(org.metadata) as OrganizationMetadataWithSub;
    } catch {
      // ignore
    }
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + durationMonths);

  const updatedSubscription: SubscriptionInfo = {
    ...DEFAULT_SUBSCRIPTION,
    ...parsedMetadata.subscription,
    activatedAt: status === "active" ? now.toISOString() : null,
    expiresAt: status === "active" ? expires.toISOString() : null,
    status,
  };

  parsedMetadata.subscription = updatedSubscription;

  await db
    .update(organization)
    .set({
      metadata: JSON.stringify(parsedMetadata),
    })
    .where(eq(organization.id, organizationId));

  return updatedSubscription;
};
