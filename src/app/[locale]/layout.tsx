import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export const generateStaticParams = (): { locale: string }[] =>
  routing.locales.map((locale) => ({ locale }));

const isSupportedLocale = (locale: string): locale is Locale =>
  routing.locales.some((item) => item === locale);

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
};

export default LocaleLayout;
