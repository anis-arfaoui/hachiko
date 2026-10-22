import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  description:
    "Plateforme de carte de fidélité digitale pour commerces sans application",
  icons: {
    apple: "/apple-icon.png",
    icon: [
      { sizes: "any", url: "/favicon.ico" },
      { type: "image/png", url: "/icon.png" },
    ],
  },
  title: "Walaa | Fidélité Digitale Sans Application",
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html
    className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
    lang="fr"
  >
    <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
      {children}
    </body>
  </html>
);

export default RootLayout;
