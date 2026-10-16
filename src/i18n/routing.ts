import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  defaultLocale: "fr",
  localePrefix: "as-needed",
  locales: ["fr"],
});

export type Locale = (typeof routing.locales)[number];
