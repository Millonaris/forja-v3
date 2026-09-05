import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  define: {
    __VERSION_FORJA__: JSON.stringify(version),
    __FECHA_FORJA__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  // Rutas relativas: funciona igual en la raíz que en una subcarpeta de GitHub Pages.
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["iconos/*.png"],
      manifest: {
        name: "FORJA",
        short_name: "FORJA",
        description: "Hipertrofia, definición, running, postura y recuperación. Todo local.",
        lang: "es",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0A0A0B",
        theme_color: "#0A0A0B",
        categories: ["health", "fitness", "lifestyle"],
        icons: [
          { src: "iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "iconos/icono-monocromo-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
        ],
        shortcuts: [
          { name: "Empezar entreno", short_name: "Entreno", url: "./#entrenar" },
          { name: "Apuntar peso", short_name: "Peso", url: "./#peso" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
        // Las fuentes de Google se guardan la primera vez que se ven: la app
        // sigue con su tipografía sin conexión.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-files", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: Number(process.env.PORT) || 5174, strictPort: false, host: true },
  preview: { port: Number(process.env.PORT) || 4174, host: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("dexie")) return "datos";
          return "vendor";
        },
      },
    },
  },
});
