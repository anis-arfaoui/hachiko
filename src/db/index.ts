import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as authSchema from "./schema/auth";
import * as loyaltySchema from "./schema/loyalty";

const connectionString = process.env.DATABASE_URL ?? "";

const pool = new Pool({ connectionString });

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
    ...loyaltySchema,
  },
});
