import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames skipping internal Next.js assets, static files, and APIs
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
