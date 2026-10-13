import { like } from "drizzle-orm";

import { db } from "@/db";
import { organization } from "@/db/schema/auth";

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replaceAll(/[\s_]+/gu, "-")
    .replaceAll(/[^\w-]+/gu, "")
    .replaceAll(/--+/gu, "-");

export const generateUniqueSlug = async (baseText: string): Promise<string> => {
  const cleanBase = slugify(baseText) || "shop";
  const existingOrgs = await db
    .select({ slug: organization.slug })
    .from(organization)
    .where(like(organization.slug, `${cleanBase}%`));

  const existingSlugs = new Set(existingOrgs.map((o) => o.slug));
  if (!existingSlugs.has(cleanBase)) {
    return cleanBase;
  }

  let candidate = `${cleanBase}-${crypto.randomUUID().slice(0, 4)}`;
  while (existingSlugs.has(candidate)) {
    candidate = `${cleanBase}-${crypto.randomUUID().slice(0, 6)}`;
  }

  return candidate;
};
