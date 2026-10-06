import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { db } from "@/db";

const APP_URL = "https://hachiko-phi.vercel.app";

const getBaseUrl = (): string => {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/+$/u, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return APP_URL;
};

const trustedOrigins = [
  "http://localhost:3000",
  APP_URL,
  ...(process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL.replace(/\/+$/u, "")]
    : []),
];

export const auth = betterAuth({
  advanced: {
    trustedProxyHeaders: true,
  },
  baseURL: getBaseUrl(),
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
  trustedOrigins,
});

export type Session = typeof auth.$Infer.Session;
