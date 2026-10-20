import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  member,
  organization,
  session as sessionTable,
} from "@/db/schema/auth";
import { isSuperAdminEmail } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { generateUniqueSlug } from "@/lib/slug";

export interface ResolvedMerchantSession {
  organization: {
    id: string;
    name: string;
    slug: string | null;
  };
  organizationId: string;
  userId: string;
}

export const getMerchantSession =
  async (): Promise<ResolvedMerchantSession | null> => {
    let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
    try {
      const reqHeaders = await headers();
      session = await auth.api.getSession({ headers: reqHeaders });
    } catch (error) {
      console.warn("[getMerchantSession] Could not resolve session:", error);
      return null;
    }

    if (!session?.user) {
      return null;
    }

    const activeOrgId = (
      session.session as { activeOrganizationId?: string | null }
    ).activeOrganizationId;
    let organizationId = activeOrgId;
    let orgData: { id: string; name: string; slug: string | null } | null =
      null;

    if (organizationId) {
      const [firstOrg] = await db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        })
        .from(organization)
        .where(eq(organization.id, organizationId))
        .limit(1);

      if (firstOrg) {
        orgData = firstOrg;
      }
    }

    // If activeOrganizationId is not set or not found in DB, check if the user belongs to any organization
    if (!orgData) {
      const [firstMembership] = await db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        })
        .from(member)
        .innerJoin(organization, eq(member.organizationId, organization.id))
        .where(eq(member.userId, session.user.id))
        .limit(1);

      if (firstMembership) {
        orgData = firstMembership;
        organizationId = orgData.id;

        // Persist active organization on the session in DB
        await db
          .update(sessionTable)
          .set({ activeOrganizationId: organizationId })
          .where(eq(sessionTable.id, session.session.id));
      }
    }

    // Auto-heal: If an authenticated merchant user has no organization yet, create one seamlessly
    // Exception: Super Admin should NEVER have a fake dummy organization created!
    if (!orgData) {
      if (isSuperAdminEmail(session.user.email)) {
        return null;
      }

      const fallbackOrgName = `Boutique de ${session.user.name || "Commerçant"}`;
      const uniqueSlug = await generateUniqueSlug(fallbackOrgName);
      const newOrgId = crypto.randomUUID();
      const now = new Date();

      await db.insert(organization).values({
        createdAt: now,
        id: newOrgId,
        name: fallbackOrgName,
        slug: uniqueSlug,
      });

      await db.insert(member).values({
        createdAt: now,
        id: crypto.randomUUID(),
        organizationId: newOrgId,
        role: "owner",
        userId: session.user.id,
      });

      orgData = {
        id: newOrgId,
        name: fallbackOrgName,
        slug: uniqueSlug,
      };
      organizationId = newOrgId;

      await db
        .update(sessionTable)
        .set({ activeOrganizationId: organizationId })
        .where(eq(sessionTable.id, session.session.id));
    }

    return {
      organization: orgData,
      organizationId: orgData.id,
      userId: session.user.id,
    };
  };
