import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  background_color: "#ffffff",
  description: "Carte de fidélité digitale pour vos commerces préférés",
  display: "standalone",
  icons: [
    {
      sizes: "192x192",
      src: "/icon-192.png",
      type: "image/png",
    },
    {
      sizes: "512x512",
      src: "/icon-512.png",
      type: "image/png",
    },
  ],
  name: "Fidélité Digitale",
  short_name: "Fidélité",
  start_url: "/",
  theme_color: "#18181b",
});

export default manifest;
