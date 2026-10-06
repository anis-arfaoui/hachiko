import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames, skipping internal Next.js assets and APIs
  matcher: ["/", "/(fr)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
