import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema/loyalty";
import { normalizeAlgerianPhone } from "@/lib/phone";

export interface CustomerInput {
  name: string;
  phone: string;
}

const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const generateCustomerCode = async (
  organizationId: string
): Promise<string> => {
  const candidates: string[] = [];
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let randomPart = "";
    for (let i = 0; i < 6; i += 1) {
      const idx = Math.floor(Math.random() * CODE_CHARS.length);
      randomPart += CODE_CHARS[idx];
    }
    candidates.push(`C-${randomPart}`);
  }

  const existingRows = await db
    .select({ code: customers.code })
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, organizationId),
        inArray(customers.code, candidates)
      )
    );

  const existingSet = new Set(existingRows.map((r) => r.code));
  for (const candidate of candidates) {
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  return `C-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
};

export const findOrCreateCustomer = async (
  organizationId: string,
  input: CustomerInput
) => {
  const normalizedPhone = normalizeAlgerianPhone(input.phone);

  const existing = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, organizationId),
        eq(customers.phone, normalizedPhone)
      )
    )
    .limit(1);

  if (existing[0]) {
    // Backfill code if existing customer doesn't have one yet
    if (!existing[0].code) {
      const code = await generateCustomerCode(organizationId);
      const [updated] = await db
        .update(customers)
        .set({ code })
        .where(eq(customers.id, existing[0].id))
        .returning();
      return updated ?? { ...existing[0], code };
    }
    return existing[0];
  }

  const code = await generateCustomerCode(organizationId);

  const inserted = await db
    .insert(customers)
    .values({
      code,
      id: crypto.randomUUID(),
      name: input.name.trim(),
      organizationId,
      phone: normalizedPhone,
    })
    .returning();

  return inserted[0];
};

export const getCustomersByOrganization = (organizationId: string) =>
  db
    .select()
    .from(customers)
    .where(eq(customers.organizationId, organizationId))
    .orderBy(desc(customers.createdAt));
