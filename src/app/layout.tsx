import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  description: "Plateforme de carte de fidélité digitale pour commerces",
  title: "Fidélité Digitale",
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html
    className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    lang="fr"
  >
    <body className="bg-background text-foreground flex min-h-full flex-col">
      {children}
    </body>
  </html>
);

export default RootLayout;
