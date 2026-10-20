import { count, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";

import type { SubscriptionInfo, SubscriptionStatus } from "@/dal/subscription";
import { computeEffectiveSubscription } from "@/dal/subscription";
import { db } from "@/db";
import { member, organization, session, user } from "@/db/schema/auth";
import {
  customers,
  locations,
  redemptions,
  subscriptions,
  transactions,
} from "@/db/schema/loyalty";
import { isSuperAdminEmail } from "@/lib/admin";
import { auth } from "@/lib/auth";

interface AdminParsedOrgMetadata {
  activityType?: string;
  address?: string;
  city?: string;
  description?: string;
  phone?: string;
  stampIcon?: string;
  subscription?: SubscriptionInfo;
}

export interface AdminStats {
  pendingLocationsCount: number;
  pendingSubscriptionsCount: number;
  totalCustomers: number;
  totalLocations: number;
  totalOrganizations: number;
  totalRedemptions: number;
  totalTransactions: number;
}

export interface AdminPendingSubscription {
  billingCycle: string;
  createdAt: Date;
  customerCount: number;
  hasNfcPlaque: boolean;
  organizationId: string;
  organizationName: string;
  organizationSlug: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  plan: "starter" | "pro";
  pointsOfSale: number;
  price: number;
  requestedAt: string | null;
}

export interface AdminOrganizationItem {
  createdAt: Date;
  customerCount: number;
  daysRemaining?: number;
  graceDaysRemaining?: number;
  id: string;
  locations: {
    address: string | null;
    city: string | null;
    id: string;
    isDefault: boolean;
    name: string;
    phone: string | null;
    status: string;
  }[];
  logo: string | null;
  name: string;
  ownerEmail: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  slug: string | null;
  subscription: SubscriptionInfo;
  transactionCount: number;
}

export interface AdminPendingStore {
  address: string | null;
  city: string | null;
  createdAt: Date;
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  phone: string | null;
}

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) {
    return false;
  }
  const cleanEmail = email.trim().toLowerCase();

  const envAdmins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return isSuperAdminEmail(cleanEmail) || envAdmins.includes(cleanEmail);
};

export const getAdminSession = async (): Promise<{
  user: { email: string; id: string; name: string };
} | null> => {
  let currentSession: Awaited<ReturnType<typeof auth.api.getSession>> | null =
    null;
  try {
    const reqHeaders = await headers();
    currentSession = await auth.api.getSession({ headers: reqHeaders });
  } catch (error) {
    console.warn("[getAdminSession] Could not resolve admin session:", error);
    return null;
  }

  if (!currentSession?.user?.email) {
    return null;
  }

  if (!isAdminEmail(currentSession.user.email)) {
    return null;
  }

  return {
    user: {
      email: currentSession.user.email,
      id: currentSession.user.id,
      name: currentSession.user.name,
    },
  };
};

/**
 * Fetches high-level global KPIs for the superadmin dashboard
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const [
    [orgCountRes],
    [customerCountRes],
    [locCountRes],
    [txCountRes],
    [redemptionCountRes],
    [pendingLocCountRes],
    pendingSubs,
  ] = await Promise.all([
    db.select({ value: count(organization.id) }).from(organization),
    db.select({ value: count(customers.id) }).from(customers),
    db.select({ value: count(locations.id) }).from(locations),
    db.select({ value: count(transactions.id) }).from(transactions),
    db.select({ value: count(redemptions.id) }).from(redemptions),
    db
      .select({ value: count(locations.id) })
      .from(locations)
      .where(eq(locations.status, "pending")),
    db
      .select({
        id: organization.id,
        metadata: organization.metadata,
      })
      .from(organization)
      .where(sql`${organization.metadata} LIKE '%"status":"pending"%'`),
  ]);

  return {
    pendingLocationsCount: pendingLocCountRes?.value ?? 0,
    pendingSubscriptionsCount: pendingSubs.length,
    totalCustomers: customerCountRes?.value ?? 0,
    totalLocations: locCountRes?.value ?? 0,
    totalOrganizations: orgCountRes?.value ?? 0,
    totalRedemptions: redemptionCountRes?.value ?? 0,
    totalTransactions: txCountRes?.value ?? 0,
  };
};

/**
 * Fetches all pending subscription requests (status === "pending")
 */
export const getAdminPendingSubscriptions = async (): Promise<
  AdminPendingSubscription[]
> => {
  const pendingOrgs = await db
    .select({
      createdAt: organization.createdAt,
      id: organization.id,
      metadata: organization.metadata,
      name: organization.name,
      slug: organization.slug,
    })
    .from(organization)
    .where(sql`${organization.metadata} LIKE '%"status":"pending"%'`)
    .orderBy(desc(organization.createdAt));

  if (pendingOrgs.length === 0) {
    return [];
  }

  const [owners, customerCounts] = await Promise.all([
    db
      .select({
        email: user.email,
        name: user.name,
        organizationId: member.organizationId,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.role, "owner")),
    db
      .select({
        count: count(customers.id),
        organizationId: customers.organizationId,
      })
      .from(customers)
      .groupBy(customers.organizationId),
  ]);

  const ownerMap = new Map(
    owners.map((o) => [o.organizationId, { email: o.email, name: o.name }])
  );
  const customerCountMap = new Map(
    customerCounts.map((c) => [c.organizationId, c.count])
  );

  const result: AdminPendingSubscription[] = [];

  for (const org of pendingOrgs) {
    let parsed: AdminParsedOrgMetadata = {};
    if (org.metadata) {
      try {
        parsed = JSON.parse(org.metadata);
      } catch {
        // ignore
      }
    }

    const sub = parsed.subscription;
    if (!sub || sub.status !== "pending") {
      continue;
    }

    const owner = ownerMap.get(org.id);

    result.push({
      billingCycle: sub.billingCycle || "mensuel",
      createdAt: org.createdAt,
      customerCount: customerCountMap.get(org.id) ?? 0,
      hasNfcPlaque: sub.hasNfcPlaque ?? false,
      organizationId: org.id,
      organizationName: org.name,
      organizationSlug: org.slug,
      ownerEmail: owner?.email ?? null,
      ownerName: owner?.name ?? null,
      ownerPhone: parsed.phone ?? null,
      plan: sub.plan || "starter",
      pointsOfSale: sub.pointsOfSale || 1,
      price: sub.price || 4900,
      requestedAt: sub.requestedAt ?? null,
    });
  }

  return result;
};

/**
 * Fetches all pending store approval requests
 */
export const getAdminPendingStores = async (): Promise<AdminPendingStore[]> => {
  const pendingRows = await db
    .select({
      address: locations.address,
      city: locations.city,
      createdAt: locations.createdAt,
      id: locations.id,
      metadata: organization.metadata,
      name: locations.name,
      organizationId: locations.organizationId,
      organizationName: organization.name,
      phone: locations.phone,
    })
    .from(locations)
    .innerJoin(organization, eq(locations.organizationId, organization.id))
    .where(eq(locations.status, "pending"))
    .orderBy(desc(locations.createdAt));

  const orgIds = [...new Set(pendingRows.map((r) => r.organizationId))];

  let ownerMap = new Map<string, string>();
  if (orgIds.length > 0) {
    const owners = await db
      .select({
        email: user.email,
        organizationId: member.organizationId,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.role, "owner"));

    ownerMap = new Map(owners.map((o) => [o.organizationId, o.email]));
  }

  return pendingRows.map((row) => {
    let orgPhone: string | null = null;
    if (row.metadata) {
      try {
        const parsed = JSON.parse(row.metadata) as AdminParsedOrgMetadata;
        orgPhone = parsed.phone ?? null;
      } catch {
        // ignore
      }
    }

    return {
      address: row.address,
      city: row.city,
      createdAt: row.createdAt,
      id: row.id,
      name: row.name,
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      ownerEmail: ownerMap.get(row.organizationId) ?? null,
      ownerPhone: row.phone || orgPhone,
      phone: row.phone,
    };
  });
};

/**
 * Fetches all organizations with full subscription & store details
 */
export const getAdminOrganizations = async (): Promise<
  AdminOrganizationItem[]
> => {
  const orgs = await db
    .select({
      createdAt: organization.createdAt,
      id: organization.id,
      logo: organization.logo,
      metadata: organization.metadata,
      name: organization.name,
      slug: organization.slug,
    })
    .from(organization)
    .orderBy(desc(organization.createdAt));

  if (orgs.length === 0) {
    return [];
  }

  const [owners, allLocations, allCustomers, allTransactions] =
    await Promise.all([
      db
        .select({
          email: user.email,
          name: user.name,
          organizationId: member.organizationId,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id)),
      db
        .select({
          address: locations.address,
          city: locations.city,
          id: locations.id,
          isDefault: locations.isDefault,
          name: locations.name,
          organizationId: locations.organizationId,
          phone: locations.phone,
          status: locations.status,
        })
        .from(locations)
        .orderBy(desc(locations.isDefault), desc(locations.createdAt)),
      db
        .select({
          count: count(customers.id),
          organizationId: customers.organizationId,
        })
        .from(customers)
        .groupBy(customers.organizationId),
      db
        .select({
          count: count(transactions.id),
          organizationId: locations.organizationId,
        })
        .from(transactions)
        .innerJoin(locations, eq(transactions.locationId, locations.id))
        .groupBy(locations.organizationId),
    ]);

  const ownerMap = new Map(
    owners.map((o) => [o.organizationId, { email: o.email, name: o.name }])
  );

  const locationsMap = new Map<string, typeof allLocations>();
  for (const loc of allLocations) {
    const list = locationsMap.get(loc.organizationId) ?? [];
    list.push(loc);
    locationsMap.set(loc.organizationId, list);
  }

  const customerCountMap = new Map(
    allCustomers.map((c) => [c.organizationId, c.count])
  );
  const txCountMap = new Map(
    allTransactions.map((t) => [t.organizationId, t.count])
  );

  return orgs.map((org) => {
    let parsedMetadata: AdminParsedOrgMetadata = {};

    if (org.metadata) {
      try {
        parsedMetadata = JSON.parse(org.metadata);
      } catch {
        // ignore parse error
      }
    }

    const customerCount = customerCountMap.get(org.id) ?? 0;
    const rawSub: SubscriptionInfo = parsedMetadata.subscription ?? {
      billingCycle: "mensuel",
      hasNfcPlaque: false,
      plan: "starter",
      pointsOfSale: 1,
      price: 4900,
      status: "trial",
    };

    const { daysRemaining, graceDaysRemaining, subscription } =
      computeEffectiveSubscription(rawSub, customerCount);

    const orgLocations = locationsMap.get(org.id) ?? [];
    const owner = ownerMap.get(org.id);

    return {
      createdAt: org.createdAt,
      customerCount,
      daysRemaining,
      graceDaysRemaining,
      id: org.id,
      locations: orgLocations,
      logo: org.logo,
      name: org.name,
      ownerEmail: owner?.email ?? null,
      ownerName: owner?.name ?? null,
      ownerPhone: parsedMetadata.phone ?? orgLocations[0]?.phone ?? null,
      slug: org.slug,
      subscription,
      transactionCount: txCountMap.get(org.id) ?? 0,
    };
  });
};

/**
 * Superadmin validates and activates a pending store.
 * Automatically increments pointsOfSale quota if needed.
 */
export const adminApproveStore = async (
  locationId: string
): Promise<{ error?: string; success: boolean }> => {
  const [loc] = await db
    .select({
      id: locations.id,
      organizationId: locations.organizationId,
    })
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  if (!loc) {
    return { error: "Boutique introuvable.", success: false };
  }

  // 1. Activate location
  await db
    .update(locations)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(locations.id, locationId));

  // 2. Count active locations and update org metadata subscription pointsOfSale
  const [activeLocs] = await db
    .select({ count: count(locations.id) })
    .from(locations)
    .where(eq(locations.organizationId, loc.organizationId));

  const totalActive = activeLocs?.count ?? 1;

  const [org] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, loc.organizationId))
    .limit(1);

  if (org?.metadata) {
    try {
      const parsed: AdminParsedOrgMetadata = JSON.parse(org.metadata);
      const existingSub = parsed.subscription ?? {
        billingCycle: "mensuel",
        hasNfcPlaque: false,
        plan: "starter",
        pointsOfSale: 1,
        price: 4900,
        status: "trial",
      };

      parsed.subscription = {
        ...existingSub,
        pointsOfSale: Math.max(existingSub.pointsOfSale || 1, totalActive),
      };

      await db
        .update(organization)
        .set({ metadata: JSON.stringify(parsed) })
        .where(eq(organization.id, loc.organizationId));
    } catch {
      // ignore
    }
  }

  return { success: true };
};

/**
 * Superadmin validates a payment for a subscription request.
 * - If merchant has < 30 customers: marks as "prepaid" (activation queued until 30th card).
 * - If merchant has >= 30 customers: activates immediately (extends if active, or starts from today).
 */
export const adminApproveSubscription = async (
  organizationId: string,
  options?: {
    customMonths?: number;
    plan?: "starter" | "pro";
  }
): Promise<{ error?: string; success: boolean }> => {
  const [org] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) {
    return { error: "Commerce introuvable.", success: false };
  }

  const [customerCountRes] = await db
    .select({ value: count(customers.id) })
    .from(customers)
    .where(eq(customers.organizationId, organizationId));

  const customerCount = customerCountRes?.value ?? 0;

  let parsed: AdminParsedOrgMetadata = {};
  if (org.metadata) {
    try {
      parsed = JSON.parse(org.metadata);
    } catch {
      // ignore
    }
  }

  const existingSub = parsed.subscription ?? {
    billingCycle: "mensuel",
    hasNfcPlaque: false,
    plan: "starter",
    pointsOfSale: 1,
    price: 4900,
    status: "trial",
  };

  const plan = options?.plan ?? existingSub.plan ?? "starter";
  const cycle = existingSub.billingCycle || "mensuel";

  let durationMonths = options?.customMonths ?? 1;
  if (!options?.customMonths) {
    if (cycle === "semestriel") {
      durationMonths = 6;
    } else if (cycle === "annuel") {
      durationMonths = 12;
    }
  }

  const now = new Date();

  // RULE: If customer has fewer than 30 cards, QUEUE as prepaid!
  if (customerCount < 30) {
    parsed.subscription = {
      ...existingSub,
      billingCycle: cycle,
      plan,
      prepaidPlan: {
        billingCycle: cycle,
        durationMonths,
        paidAt: now.toISOString(),
        plan,
      },
      status: "prepaid",
    };

    await db
      .update(organization)
      .set({ metadata: JSON.stringify(parsed) })
      .where(eq(organization.id, organizationId));

    return { success: true };
  }

  // If customer has >= 30 cards, activate immediately!
  const baseDate =
    existingSub.expiresAt && new Date(existingSub.expiresAt) > now
      ? new Date(existingSub.expiresAt)
      : new Date(now);
  const nextExpiry = new Date(baseDate);
  nextExpiry.setMonth(nextExpiry.getMonth() + durationMonths);

  parsed.subscription = {
    ...existingSub,
    activatedAt: now.toISOString(),
    billingCycle: cycle,
    expiresAt: nextExpiry.toISOString(),
    graceUntil: null,
    plan,
    prepaidPlan: null,
    status: "active",
  };

  await Promise.all([
    db
      .update(organization)
      .set({ metadata: JSON.stringify(parsed) })
      .where(eq(organization.id, organizationId)),
    db
      .insert(subscriptions)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        paidUntil: nextExpiry,
      })
      .onConflictDoUpdate({
        set: { paidUntil: nextExpiry },
        target: subscriptions.organizationId,
      }),
  ]);

  return { success: true };
};

/**
 * Superadmin manual editing of any organization's subscription
 */
export const adminManualEditSubscription = async (
  organizationId: string,
  data: {
    addMonths?: number;
    exactExpiresAt?: string;
    hasNfcPlaque?: boolean;
    plan?: "starter" | "pro";
    pointsOfSale?: number;
    status: SubscriptionStatus;
  }
): Promise<{ error?: string; success: boolean }> => {
  const [org] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) {
    return { error: "Commerce introuvable.", success: false };
  }

  let parsed: AdminParsedOrgMetadata = {};
  if (org.metadata) {
    try {
      parsed = JSON.parse(org.metadata);
    } catch {
      // ignore
    }
  }

  const existingSub = parsed.subscription ?? {
    billingCycle: "mensuel",
    hasNfcPlaque: false,
    plan: "starter",
    pointsOfSale: 1,
    price: 4900,
    status: "trial",
  };

  const now = new Date();
  let nextExpiry: Date | null = null;

  if (data.exactExpiresAt) {
    nextExpiry = new Date(data.exactExpiresAt);
  } else if (data.addMonths && data.addMonths > 0) {
    const baseDate =
      existingSub.expiresAt && new Date(existingSub.expiresAt) > now
        ? new Date(existingSub.expiresAt)
        : now;
    nextExpiry = new Date(baseDate);
    nextExpiry.setMonth(nextExpiry.getMonth() + data.addMonths);
  } else if (existingSub.expiresAt) {
    nextExpiry = new Date(existingSub.expiresAt);
  }

  parsed.subscription = {
    ...existingSub,
    activatedAt:
      data.status === "active"
        ? (existingSub.activatedAt ?? now.toISOString())
        : existingSub.activatedAt,
    expiresAt: nextExpiry ? nextExpiry.toISOString() : existingSub.expiresAt,
    graceUntil:
      data.status === "grace"
        ? (existingSub.graceUntil ??
          new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString())
        : null,
    hasNfcPlaque: data.hasNfcPlaque ?? existingSub.hasNfcPlaque ?? false,
    plan: data.plan ?? existingSub.plan,
    pointsOfSale: data.pointsOfSale ?? existingSub.pointsOfSale ?? 1,
    status: data.status,
  };

  await Promise.all([
    db
      .update(organization)
      .set({ metadata: JSON.stringify(parsed) })
      .where(eq(organization.id, organizationId)),
    nextExpiry
      ? db
          .insert(subscriptions)
          .values({
            id: crypto.randomUUID(),
            organizationId,
            paidUntil: nextExpiry,
          })
          .onConflictDoUpdate({
            set: { paidUntil: nextExpiry },
            target: subscriptions.organizationId,
          })
      : Promise.resolve(),
  ]);

  return { success: true };
};

/**
 * Superadmin switches their active organization to inspect a merchant's dashboard
 */
export const adminSwitchActiveOrg = async (
  organizationId: string
): Promise<{ error?: string; success: boolean }> => {
  let currentSession: Awaited<ReturnType<typeof auth.api.getSession>> | null =
    null;
  try {
    const reqHeaders = await headers();
    currentSession = await auth.api.getSession({ headers: reqHeaders });
  } catch (error) {
    console.warn("[adminSwitchActiveOrg] Could not resolve session:", error);
    return { error: "Session introuvable.", success: false };
  }

  if (!currentSession?.session?.id) {
    return { error: "Session introuvable.", success: false };
  }

  await db
    .update(session)
    .set({
      activeOrganizationId: organizationId,
      updatedAt: new Date(),
    })
    .where(eq(session.id, currentSession.session.id));

  return { success: true };
};
