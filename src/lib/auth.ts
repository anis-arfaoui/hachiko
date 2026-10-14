import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { db } from "@/db";
import { member, organization as orgTable } from "@/db/schema/auth";
import {
  sendPasswordResetEmail,
  sendVerificationEmailMessage,
} from "@/lib/email";
import { generateUniqueSlug } from "@/lib/slug";

interface SignUpContext {
  body?: {
    businessName?: string;
    phone?: string;
    phoneNumber?: string;
  };
}

const getBusinessNameFromContext = (
  context: SignUpContext | undefined,
  fallback: string
): string => {
  const raw = context?.body?.businessName;
  if (!raw) {
    return fallback;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const DEFAULT_PROD_URL = "https://www.walaa.tech";

const getBaseUrl = (): string => {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/+$/u, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/u, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/u, "")}`;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return DEFAULT_PROD_URL;
};

const getAuthSecret = (): string => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: BETTER_AUTH_SECRET environment variable is missing in production. Generate one via `openssl rand -base64 32`."
      );
    }
    return "dev-secret-loyalty-app-min-32-chars-strictly-for-local-development";
  }
  return secret;
};

const configuredOrigins = [
  "http://localhost:3000",
  DEFAULT_PROD_URL,
  "https://www.walaa.tech",
  "https://walaa.tech",
  "https://hachiko-phi.vercel.app",
  process.env.BETTER_AUTH_URL?.replace(/\/+$/u, ""),
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/u, ""),
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/\/+$/u, "")}`
    : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/u, "")}`
    : undefined,
].filter((url): url is string => Boolean(url));

const trustedOrigins = [...new Set(configuredOrigins)];

export const auth = betterAuth({
  advanced: {
    trustedProxyHeaders: true,
  },
  baseURL: getBaseUrl(),
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser, context) => {
          try {
            // SAFETY: Better Auth passes EndpointContext which contains optional body with businessName
            const ctx = context as SignUpContext | undefined;
            const businessName = getBusinessNameFromContext(
              ctx,
              `Boutique de ${createdUser.name}`
            );
            const slug = await generateUniqueSlug(businessName);
            const orgId = crypto.randomUUID();
            const now = new Date();

            const userPhone =
              ctx?.body?.phoneNumber?.trim() || ctx?.body?.phone?.trim();

            await db.insert(orgTable).values({
              createdAt: now,
              id: orgId,
              metadata: userPhone
                ? JSON.stringify({ phone: userPhone })
                : undefined,
              name: businessName,
              slug,
            });

            await db.insert(member).values({
              createdAt: now,
              id: crypto.randomUUID(),
              organizationId: orgId,
              role: "owner",
              userId: createdUser.id,
            });
          } catch (error) {
            console.error(
              "[Auth Hook] Failed to create organization in user.create.after:",
              error
            );
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        url,
        userName: user.name,
      });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    expiresIn: 3600,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmailMessage({
        to: user.email,
        url,
        userName: user.name,
      });
    },
  },
  plugins: [organization()],
  secret: getAuthSecret(),
  trustedOrigins,
});

export type Session = typeof auth.$Infer.Session;
