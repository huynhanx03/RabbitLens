import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const developmentApiTarget =
  process.env.RABBITMQ_MANAGEMENT_URL ?? "http://127.0.0.1:15672";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      enableRouteGeneration: true,
      routesDirectory: "./src/app/routes",
      generatedRouteTree: "./src/app/route-tree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      "/api": {
        target: developmentApiTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    manifest: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("echarts") || id.includes("zrender")) {
              return "chart-vendor";
            }
            if (id.includes("oidc-client-ts")) {
              return "oidc-client";
            }
            if (id.includes("react") || id.includes("tanstack") || id.includes("lucide")) {
              return "framework";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
