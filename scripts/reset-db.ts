import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("FATAL: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const sql = neon(databaseUrl);

const cleanDatabase = async () => {
  console.log("Starting clean database reset...");

  const tables = [
    '"transactions"',
    '"redemptions"',
    '"cards"',
    '"customers"',
    '"rewards"',
    '"programs"',
    '"locations"',
    '"subscriptions"',
    '"invitation"',
    '"member"',
    '"session"',
    '"account"',
    '"verification"',
    '"organization"',
    '"user"',
  ];

  await sql.query(`TRUNCATE TABLE ${tables.join(", ")} CASCADE;`);
  console.log("Database successfully cleaned and ready for a fresh restart!");
};

try {
  await cleanDatabase();
} catch (error) {
  console.error("Error cleaning database:", error);
  process.exit(1);
}
