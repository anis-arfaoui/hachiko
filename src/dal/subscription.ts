import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { customers, subscriptions } from "@/db/schema/loyalty";

export type SubscriptionStatus =
  | "trial"
  | "prepaid"
  | "pending"
  | "active"
  | "grace"
  | "expired";

export interface PrepaidPlanInfo {
  billingCycle: "mensuel" | "semestriel" | "annuel";
  durationMonths: number;
  paidAt: string;
  plan: "starter" | "pro";
}

export interface SubscriptionInfo {
  activatedAt?: string | null;
  billingCycle: "mensuel" | "semestriel" | "annuel";
  expiresAt?: string | null;
  graceUntil?: string | null;
  hasNfcPlaque: boolean;
  plan: "starter" | "pro";
  pointsOfSale: number;
  prepaidPlan?: PrepaidPlanInfo | null;
  // Price in Algerian Dinars (DZD)
  price: number;
  requestedAt?: string | null;
  status: SubscriptionStatus;
  trialReachedAt?: string | null;
}

export interface SubscriptionDetails {
  customerCount: number;
  daysRemaining?: number;
  graceDaysRemaining?: number;
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

export const MAX_FREE_CUSTOMERS = 30;
export const GRACE_PERIOD_DAYS = 3;

export const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  activatedAt: null,
  billingCycle: "mensuel",
  expiresAt: null,
  graceUntil: null,
  hasNfcPlaque: false,
  plan: "starter",
  pointsOfSale: 1,
  prepaidPlan: null,
  price: 4900,
  requestedAt: null,
  status: "trial",
  trialReachedAt: null,
};

/**
 * Computes the effective live subscription state based on timestamps and customer count.
 * Handles automatic transitions:
 * - Prepaid -> Active upon reaching 30 cards
 * - Active -> Grace -> Expired upon expiry
 * - Trial -> Grace -> Expired upon reaching 30 cards without payment
 */
export interface ComputedSubscriptionResult {
  daysRemaining: number;
  graceDaysRemaining: number;
  subscription: SubscriptionInfo;
  updatedInDbNeeded: boolean;
}

export const computeEffectiveSubscription = (
  rawSub: SubscriptionInfo,
  customerCount: number
): ComputedSubscriptionResult => {
  const now = new Date();
  const sub: SubscriptionInfo = { ...rawSub };
  let updatedInDbNeeded = false;

  // Case 1: Prepaid subscription waiting for 30 cards
  if (sub.status === "prepaid" && customerCount >= MAX_FREE_CUSTOMERS) {
    // Trigger activation: paid duration starts NOW!
    const durationMonths = sub.prepaidPlan?.durationMonths ?? 1;
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + durationMonths);

    sub.status = "active";
    sub.activatedAt = now.toISOString();
    sub.expiresAt = expires.toISOString();
    sub.graceUntil = null;
    sub.plan = sub.prepaidPlan?.plan ?? sub.plan;
    sub.billingCycle = sub.prepaidPlan?.billingCycle ?? sub.billingCycle;
    sub.prepaidPlan = null;
    updatedInDbNeeded = true;
  }

  // Case 2: Active paid subscription
  if (sub.status === "active" && sub.expiresAt) {
    const expDate = new Date(sub.expiresAt);
    if (expDate <= now) {
      // Expiry reached! Enter 3-day grace period
      const graceEnd = new Date(
        expDate.getTime() + GRACE_PERIOD_DAYS * 24 * 3600 * 1000
      );
      const isGrace = now < graceEnd;
      sub.status = isGrace ? "grace" : "expired";
      sub.graceUntil = isGrace ? graceEnd.toISOString() : null;
      updatedInDbNeeded = true;
    }
  }

  // Case 3: Free trial
  if (sub.status === "trial" && customerCount >= MAX_FREE_CUSTOMERS) {
    const trialReached = sub.trialReachedAt
      ? new Date(sub.trialReachedAt)
      : now;
    if (!sub.trialReachedAt) {
      sub.trialReachedAt = trialReached.toISOString();
    }

    const graceEnd = new Date(
      trialReached.getTime() + GRACE_PERIOD_DAYS * 24 * 3600 * 1000
    );
    const isGrace = now < graceEnd;
    sub.status = isGrace ? "grace" : "expired";
    sub.graceUntil = isGrace ? graceEnd.toISOString() : null;
    updatedInDbNeeded = true;
  }

  // Case 4: In Grace Period
  if (sub.status === "grace" && sub.graceUntil) {
    const graceEnd = new Date(sub.graceUntil);
    if (now >= graceEnd) {
      sub.status = "expired";
      sub.graceUntil = null;
      updatedInDbNeeded = true;
    }
  }

  // Calculate days remaining
  let daysRemaining = 0;
  if (sub.status === "active" && sub.expiresAt) {
    const diffMs = new Date(sub.expiresAt).getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 3600 * 1000)));
  }

  let graceDaysRemaining = 0;
  if (sub.status === "grace" && sub.graceUntil) {
    const diffMs = new Date(sub.graceUntil).getTime() - now.getTime();
    graceDaysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 3600 * 1000)));
  }

  return {
    daysRemaining,
    graceDaysRemaining,
    subscription: sub,
    updatedInDbNeeded,
  };
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

  const rawSub: SubscriptionInfo = parsedMetadata.subscription
    ? {
        ...DEFAULT_SUBSCRIPTION,
        ...parsedMetadata.subscription,
      }
    : DEFAULT_SUBSCRIPTION;

  // 4. Compute effective state (handles trial -> grace -> expired, prepaid -> active)
  const { daysRemaining, graceDaysRemaining, subscription, updatedInDbNeeded } =
    computeEffectiveSubscription(rawSub, customerCount);

  // If state changed automatically, persist in background
  if (updatedInDbNeeded) {
    parsedMetadata.subscription = subscription;
    try {
      await db
        .update(organization)
        .set({
          metadata: JSON.stringify(parsedMetadata),
        })
        .where(eq(organization.id, organizationId));

      if (subscription.expiresAt) {
        await db
          .insert(subscriptions)
          .values({
            id: crypto.randomUUID(),
            organizationId,
            paidUntil: new Date(subscription.expiresAt),
          })
          .onConflictDoUpdate({
            set: { paidUntil: new Date(subscription.expiresAt) },
            target: subscriptions.organizationId,
          });
      }
    } catch (error) {
      console.warn(
        "[getSubscriptionDetails] Failed to persist computed subscription state:",
        error
      );
    }
  }

  return {
    customerCount,
    daysRemaining,
    graceDaysRemaining,
    maxFreeCustomers: MAX_FREE_CUSTOMERS,
    organizationName: org.name,
    organizationSlug: org.slug,
    subscription,
  };
};

/**
 * Checks if the business is allowed to register new customers.
 * Allowed in:
 * - trial (< 30 customers)
 * - prepaid
 * - active
 * - grace (within 3 days grace)
 * - pending (payment verification in progress)
 * Blocked in:
 * - expired (hard stop after grace period)
 */
export const checkCanAddCustomer = async (
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> => {
  const details = await getSubscriptionDetails(organizationId);
  if (!details) {
    return { allowed: true };
  }

  const { customerCount, subscription } = details;

  if (subscription.status === "expired") {
    return {
      allowed: false,
      reason:
        "Abonnement expiré. Veuillez régulariser votre abonnement pour ajouter de nouveaux clients.",
    };
  }

  if (subscription.status === "trial" && customerCount >= MAX_FREE_CUSTOMERS) {
    return {
      allowed: false,
      reason:
        "Limite de 30 clients gratuits atteinte. Activez votre abonnement pour continuer.",
    };
  }

  return { allowed: true };
};

/**
 * Checks if cashiers can scan stamps and redeem rewards.
 * Allowed during trial, prepaid, active, pending, and grace!
 * Blocked ONLY when expired after grace period.
 */
export const checkCanScan = async (
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> => {
  const details = await getSubscriptionDetails(organizationId);
  if (!details) {
    return { allowed: true };
  }

  const { subscription } = details;

  if (subscription.status === "expired") {
    return {
      allowed: false,
      reason:
        "L'abonnement de cet établissement a expiré. Veuillez contacter le responsable pour renouveler l'accès.",
    };
  }

  return { allowed: true };
};

/**
 * Triggered right after a customer is created.
 * Handles the 30-card milestone:
 * - If prepaid: automatically starts the paid subscription clock!
 * - If not prepaid: triggers the 3-day grace period.
 */
export const onCustomerCreatedTrigger = async (
  organizationId: string,
  newCustomerCount: number
): Promise<void> => {
  if (newCustomerCount < MAX_FREE_CUSTOMERS) {
    return;
  }

  const [org] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org?.metadata) {
    return;
  }

  try {
    const parsedMetadata = JSON.parse(
      org.metadata
    ) as OrganizationMetadataWithSub;
    const currentSub = parsedMetadata.subscription ?? DEFAULT_SUBSCRIPTION;
    const now = new Date();

    if (currentSub.status === "prepaid") {
      // PREPAID RULE: Customer just reached 30 cards! Activate subscription now.
      const durationMonths = currentSub.prepaidPlan?.durationMonths ?? 1;
      const expires = new Date(now);
      expires.setMonth(expires.getMonth() + durationMonths);

      currentSub.status = "active";
      currentSub.activatedAt = now.toISOString();
      currentSub.expiresAt = expires.toISOString();
      currentSub.graceUntil = null;
      currentSub.plan = currentSub.prepaidPlan?.plan ?? currentSub.plan;
      currentSub.billingCycle =
        currentSub.prepaidPlan?.billingCycle ?? currentSub.billingCycle;
      currentSub.prepaidPlan = null;

      parsedMetadata.subscription = currentSub;

      await db
        .update(organization)
        .set({ metadata: JSON.stringify(parsedMetadata) })
        .where(eq(organization.id, organizationId));

      await db
        .insert(subscriptions)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          paidUntil: expires,
        })
        .onConflictDoUpdate({
          set: { paidUntil: expires },
          target: subscriptions.organizationId,
        });
    } else if (currentSub.status === "trial" && !currentSub.trialReachedAt) {
      // Milestone reached without payment: start 3-day grace period
      currentSub.trialReachedAt = now.toISOString();
      const graceEnd = new Date(
        now.getTime() + GRACE_PERIOD_DAYS * 24 * 3600 * 1000
      );
      currentSub.graceUntil = graceEnd.toISOString();
      currentSub.status = "grace";

      parsedMetadata.subscription = currentSub;

      await db
        .update(organization)
        .set({ metadata: JSON.stringify(parsedMetadata) })
        .where(eq(organization.id, organizationId));
    }
  } catch (error) {
    console.error(
      "[onCustomerCreatedTrigger] Error handling milestone:",
      error
    );
  }
};

/**
 * Merchant requests a subscription or renewal
 */
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

  const existingSub = parsedMetadata.subscription ?? DEFAULT_SUBSCRIPTION;

  const updatedSubscription: SubscriptionInfo = {
    ...DEFAULT_SUBSCRIPTION,
    ...existingSub,
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

/**
 * Super Admin sets subscription status and duration
 */
export const setSubscriptionStatus = async (
  organizationId: string,
  status: SubscriptionStatus,
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

  const existingSub = parsedMetadata.subscription ?? DEFAULT_SUBSCRIPTION;
  const now = new Date();
  let expires: Date | null = null;

  let graceUntil: string | null = null;
  let prepaidPlan = existingSub.prepaidPlan ?? null;
  let trialReachedAt = existingSub.trialReachedAt ?? null;

  if (status === "active") {
    // If already active with future expiry, extend it without losing days!
    const baseDate =
      existingSub.expiresAt && new Date(existingSub.expiresAt) > now
        ? new Date(existingSub.expiresAt)
        : now;
    expires = new Date(baseDate);
    expires.setMonth(expires.getMonth() + durationMonths);
    prepaidPlan = null;
  } else if (status === "prepaid") {
    prepaidPlan = {
      billingCycle: existingSub.billingCycle || "mensuel",
      durationMonths,
      paidAt: now.toISOString(),
      plan: existingSub.plan || "starter",
    };
  } else if (status === "grace") {
    graceUntil = new Date(
      now.getTime() + GRACE_PERIOD_DAYS * 24 * 3600 * 1000
    ).toISOString();
  } else if (status === "trial") {
    trialReachedAt = null;
    graceUntil = null;
    expires = null;
  }

  const updatedSubscription: SubscriptionInfo = {
    ...DEFAULT_SUBSCRIPTION,
    ...existingSub,
    activatedAt:
      status === "active" ? now.toISOString() : existingSub.activatedAt,
    expiresAt: expires ? expires.toISOString() : existingSub.expiresAt,
    graceUntil,
    prepaidPlan,
    status,
    trialReachedAt,
  };

  parsedMetadata.subscription = updatedSubscription;

  await db
    .update(organization)
    .set({
      metadata: JSON.stringify(parsedMetadata),
    })
    .where(eq(organization.id, organizationId));

  if (expires) {
    await db
      .insert(subscriptions)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        paidUntil: expires,
      })
      .onConflictDoUpdate({
        set: { paidUntil: expires },
        target: subscriptions.organizationId,
      });
  }

  return updatedSubscription;
};
