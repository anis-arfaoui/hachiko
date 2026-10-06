import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  defaultLocale: "fr",
  localePrefix: "always",
  locales: ["fr"],
});

export type Locale = (typeof routing.locales)[number];
