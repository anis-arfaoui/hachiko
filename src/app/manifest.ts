import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  background_color: "#ffffff",
  description: "Carte de fidélité digitale pour vos commerces préférés",
  display: "standalone",
  icons: [
    {
      sizes: "192x192",
      src: "/favicon.ico",
      type: "image/x-icon",
    },
    {
      sizes: "512x512",
      src: "/favicon.ico",
      type: "image/x-icon",
    },
  ],
  name: "Fidélité Digitale",
  short_name: "Fidélité",
  start_url: "/",
  theme_color: "#18181b",
});

export default manifest;
