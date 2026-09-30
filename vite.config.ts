import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "pwa-icon1.svg"],
      manifest: {
        name: "SaveCircle - Group Savings",
        short_name: "SaveCircle",
        description:
          "Manage group contributions, schedules, and savings progress.",
        theme_color: "#064d3d",
        background_color: "#f8fbfa",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-icon1.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "savecircle-static-images",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
