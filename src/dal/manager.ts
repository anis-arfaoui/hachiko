import { and, desc, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { managers } from "@/db/schema/loyalty";

import { getProgramByOrganization } from "./program";

export interface ManagerItem {
  code: string;
  codeExpiresAt: Date | null;
  createdAt: Date;
  id: string;
  lastActiveAt: Date | null;
  name: string;
  organizationId: string;
  token: string;
}

export interface ResolvedManagerSession {
  manager: ManagerItem;
  organization: {
    id: string;
    logo: string | null;
    name: string;
    slug: string | null;
  };
  organizationId: string;
  program: {
    brandColor: string;
    id: string;
    rewardLabel: string;
    stampsRequired: number;
    type: "points" | "stamps";
  } | null;
}

export const MANAGER_COOKIE_NAME = "walaa_manager_token";

const generateRandom6DigitCode = (): string =>
  String(Math.floor(100_000 + Math.random() * 900_000));

export const generateUniqueManagerCode = async (): Promise<string> => {
  const candidates: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    candidates.push(generateRandom6DigitCode());
  }

  const existing = await db
    .select({ code: managers.code })
    .from(managers)
    .where(inArray(managers.code, candidates));

  const existingCodes = new Set(existing.map((r) => r.code));
  for (const candidate of candidates) {
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  return generateRandom6DigitCode();
};

export const getManagersByOrganization = async (
  organizationId: string
): Promise<ManagerItem[]> => {
  const rows = await db
    .select()
    .from(managers)
    .where(eq(managers.organizationId, organizationId))
    .orderBy(desc(managers.createdAt));

  return rows;
};

export const getManagerByCode = async (
  code: string
): Promise<ManagerItem | null> => {
  const normalizedCode = code.trim().replaceAll(/\s+/gu, "");
  if (!normalizedCode) {
    return null;
  }

  const [row] = await db
    .select()
    .from(managers)
    .where(eq(managers.code, normalizedCode))
    .limit(1);

  return row || null;
};

export const getManagerByToken = async (
  token: string
): Promise<ManagerItem | null> => {
  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  const [row] = await db
    .select()
    .from(managers)
    .where(eq(managers.token, trimmed))
    .limit(1);

  return row || null;
};

export const createManager = async (
  organizationId: string,
  name: string
): Promise<ManagerItem> => {
  const code = await generateUniqueManagerCode();
  const token = `mgr_${crypto.randomUUID().replaceAll("-", "")}`;
  const now = new Date();

  const [created] = await db
    .insert(managers)
    .values({
      code,
      createdAt: now,
      id: crypto.randomUUID(),
      lastActiveAt: null,
      name: name.trim(),
      organizationId,
      token,
      updatedAt: now,
    })
    .returning();

  return created;
};

export const deleteManager = async (
  organizationId: string,
  managerId: string
): Promise<boolean> => {
  const res = await db
    .delete(managers)
    .where(
      and(
        eq(managers.id, managerId),
        eq(managers.organizationId, organizationId)
      )
    );

  return Boolean(res);
};

export const regenerateManagerCode = async (
  organizationId: string,
  managerId: string
): Promise<ManagerItem | null> => {
  const newCode = await generateUniqueManagerCode();

  const [updated] = await db
    .update(managers)
    .set({
      code: newCode,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(managers.id, managerId),
        eq(managers.organizationId, organizationId)
      )
    )
    .returning();

  return updated || null;
};

export const getManagerSession =
  async (): Promise<ResolvedManagerSession | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(MANAGER_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    const manager = await getManagerByToken(token);
    if (!manager) {
      return null;
    }

    const [orgRow, program] = await Promise.all([
      db
        .select({
          id: organization.id,
          logo: organization.logo,
          name: organization.name,
          slug: organization.slug,
        })
        .from(organization)
        .where(eq(organization.id, manager.organizationId))
        .limit(1),
      getProgramByOrganization(manager.organizationId),
    ]);

    if (!orgRow[0]) {
      return null;
    }

    return {
      manager,
      organization: orgRow[0],
      organizationId: manager.organizationId,
      program: program
        ? {
            brandColor: program.brandColor,
            id: program.id,
            rewardLabel: program.rewardLabel,
            stampsRequired: program.stampsRequired,
            type: program.type === "points" ? "points" : "stamps",
          }
        : null,
    };
  };
