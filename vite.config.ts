// vite.config.ts - production client build
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => ({
  plugins: [react()],
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
