import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [organizationClient()],
});

export const {
  organization: orgClient,
  signIn,
  signOut,
  signUp,
  useActiveOrganization,
  useSession,
} = authClient;
