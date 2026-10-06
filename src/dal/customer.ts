import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema/loyalty";
import { normalizeAlgerianPhone } from "@/lib/phone";

export interface CustomerInput {
  name: string;
  phone: string;
}

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
    return existing[0];
  }

  const inserted = await db
    .insert(customers)
    .values({
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
