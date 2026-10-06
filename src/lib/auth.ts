import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { db } from "@/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [organization()],
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "development-secret-loyalty-app-min-32-chars!!",
});

export type Session = typeof auth.$Infer.Session;
