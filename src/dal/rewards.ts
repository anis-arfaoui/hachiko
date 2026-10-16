import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { rewards } from "@/db/schema/loyalty";

export interface RewardItem {
  cost: number;
  createdAt: Date;
  description: string | null;
  id: string;
  label: string;
  programId: string;
}

export interface SaveRewardInput {
  cost: number;
  description?: string | null;
  id?: string;
  label: string;
}

export const getRewardsByProgramId = (
  programId: string
): Promise<RewardItem[]> =>
  db
    .select({
      cost: rewards.cost,
      createdAt: rewards.createdAt,
      description: rewards.description,
      id: rewards.id,
      label: rewards.label,
      programId: rewards.programId,
    })
    .from(rewards)
    .where(eq(rewards.programId, programId))
    .orderBy(asc(rewards.cost));

export const getRewardById = async (
  rewardId: string
): Promise<RewardItem | null> => {
  const rows = await db
    .select({
      cost: rewards.cost,
      createdAt: rewards.createdAt,
      description: rewards.description,
      id: rewards.id,
      label: rewards.label,
      programId: rewards.programId,
    })
    .from(rewards)
    .where(eq(rewards.id, rewardId))
    .limit(1);

  return rows[0] ?? null;
};

export const syncProgramRewards = async (
  programId: string,
  rewardList: SaveRewardInput[]
): Promise<RewardItem[]> => {
  const sanitized: {
    cost: number;
    description: string | null;
    id: string;
    label: string;
  }[] = [];

  for (const r of rewardList) {
    const trimmedLabel = r.label.trim();
    if (trimmedLabel.length > 0) {
      sanitized.push({
        cost: Math.max(1, Math.trunc(Number(r.cost)) || 1),
        description: r.description?.trim() || null,
        id: r.id && r.id.length > 10 ? r.id : crypto.randomUUID(),
        label: trimmedLabel,
      });
    }
  }

  const sorted = sanitized.toSorted((a, b) => a.cost - b.cost);

  await db.transaction(async (tx) => {
    await tx.delete(rewards).where(eq(rewards.programId, programId));

    if (sorted.length > 0) {
      await tx.insert(rewards).values(
        sorted.map((item) => ({
          cost: item.cost,
          description: item.description,
          id: item.id,
          label: item.label,
          programId,
        }))
      );
    }
  });

  return getRewardsByProgramId(programId);
};
