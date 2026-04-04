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
      "/api": "http://localhost:8001",
      "/auth": "http://localhost:8001",
      "/analytics": "http://localhost:8001",
      "/users": "http://localhost:8001",
      "/tenants": "http://localhost:8001",
      "/export": "http://localhost:8001",
      "/billing": "http://localhost:8001",
      "/ai": "http://localhost:8001",
      "/profile": "http://localhost:8001",
      "/email": "http://localhost:8001",
      "/notifications": "http://localhost:8001",
    },
  },
}));
