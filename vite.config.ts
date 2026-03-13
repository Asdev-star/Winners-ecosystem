// vite.config.ts — production ready with PWA
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "pwa-192x192.svg", "pwa-512x512.svg"],
      manifest: {
        name: "Winners Ecosystem",
        short_name: "Winners",
        description: "Digital Sovereign Infrastructure for African & Diaspora Communities",
        theme_color: "#0D1520",
        background_color: "#0D1520",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "pwa-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "pwa-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
        categories: ["business", "productivity", "education"],
        shortcuts: [
          {
            name: "Dashboard",
            url: "/dashboard",
            description: "View your ecosystem dashboard",
          },
          {
            name: "Community",
            url: "/community",
            description: "Connect with the community",
          },
          {
            name: "Academy",
            url: "/academy",
            description: "Learn new skills",
          },
          {
            name: "AI Assistant",
            url: "/intelligence",
            description: "Chat with Aria AI",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB - allow large bundles
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
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
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          zustand: ["zustand"],
          charts: ["recharts"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
      "/auth": "http://localhost:3001",
      "/analytics": "http://localhost:3001",
      "/users": "http://localhost:3001",
      "/tenants": "http://localhost:3001",
      "/export": "http://localhost:3001",
      "/billing": "http://localhost:3001",
      "/ai": "http://localhost:3001",
      "/profile": "http://localhost:3001",
      "/email": "http://localhost:3001",
      "/notifications": "http://localhost:3001",
    },
  },
}));
