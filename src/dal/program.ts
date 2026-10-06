import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { programs } from "@/db/schema/loyalty";

export interface ProgramInput {
  brandColor?: string;
  logoUrl?: string;
  rewardLabel: string;
  stampsRequired: number;
}

export const getProgramByOrganization = async (organizationId: string) => {
  const result = await db
    .select()
    .from(programs)
    .where(eq(programs.organizationId, organizationId))
    .limit(1);

  return result[0] ?? null;
};

export const upsertProgram = async (
  organizationId: string,
  input: ProgramInput
) => {
  const existing = await getProgramByOrganization(organizationId);

  if (existing) {
    const updated = await db
      .update(programs)
      .set({
        brandColor: input.brandColor ?? existing.brandColor,
        logoUrl: input.logoUrl ?? existing.logoUrl,
        rewardLabel: input.rewardLabel,
        stampsRequired: input.stampsRequired,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(programs.id, existing.id),
          eq(programs.organizationId, organizationId)
        )
      )
      .returning();

    return updated[0];
  }

  const inserted = await db
    .insert(programs)
    .values({
      brandColor: input.brandColor ?? "#18181b",
      id: crypto.randomUUID(),
      logoUrl: input.logoUrl,
      organizationId,
      rewardLabel: input.rewardLabel,
      stampsRequired: input.stampsRequired,
      type: "stamps",
    })
    .returning();

  return inserted[0];
};
