import { eq } from "drizzle-orm";

import { db } from "../src/db";
import { user as userTable } from "../src/db/schema/auth";
import { auth } from "../src/lib/auth";

const ADMIN_EMAIL = "anisarfaoui2525@gmail.com";
const DEFAULT_PASSWORD = process.argv[2] || "aniswalaa123";

const seedAdmin = async () => {
  console.log(`Checking if superadmin (${ADMIN_EMAIL}) already exists...`);

  const existing = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Superadmin ${ADMIN_EMAIL} already exists in database.`);
    return;
  }

  console.log(`Creating superadmin account for ${ADMIN_EMAIL}...`);
  await auth.api.signUpEmail({
    body: {
      email: ADMIN_EMAIL,
      name: "Super Admin",
      password: DEFAULT_PASSWORD,
    },
  });

  // Ensure emailVerified is set to true
  await db
    .update(userTable)
    .set({ emailVerified: true })
    .where(eq(userTable.email, ADMIN_EMAIL));

  console.log("-----------------------------------------");
  console.log("Superadmin account successfully created!");
  console.log(`Email    : ${ADMIN_EMAIL}`);
  console.log(`Password : ${DEFAULT_PASSWORD}`);
  console.log("-----------------------------------------");
};

try {
  await seedAdmin();
  process.exit(0);
} catch (error) {
  console.error("Failed to seed superadmin:", error);
  process.exit(1);
}
