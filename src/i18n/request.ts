import { getRequestConfig } from "next-intl/server";

import frMessages from "../../messages/fr.json";
import { routing } from "./routing";

type SupportedLocale = (typeof routing.locales)[number];

const isSupportedLocale = (
  locale: string | undefined
): locale is SupportedLocale =>
  Boolean(locale && routing.locales.some((item) => item === locale));

const messages: Record<SupportedLocale, typeof frMessages> = {
  fr: frMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: SupportedLocale = isSupportedLocale(requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
