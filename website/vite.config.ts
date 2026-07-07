import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const developmentApiTarget =
  process.env.RABBITMQ_MANAGEMENT_URL ?? "http://127.0.0.1:15672";

export const CHUNK_SIZE_WARNING_LIMIT_KB = 600;

export function manualChunksForVendor(id: string) {
  if (!id.includes("node_modules")) return undefined;
  if (id.includes("echarts")) {
    return "echarts";
  }
  if (id.includes("zrender")) {
    return "zrender";
  }
  if (id.includes("oidc-client-ts")) {
    return "oidc-client";
  }
  if (id.includes("lucide-react")) {
    return "ui-icons";
  }
  if (id.includes("react-dom") || id.includes("react/")) {
    return "react-core";
  }
  if (id.includes("@tanstack/react-router")) {
    return "router";
  }
  if (id.includes("@tanstack/react-query")) {
    return "query";
  }
  if (id.includes("radix-ui") || id.includes("@radix-ui")) {
    return "ui-vendor";
  }
  return "vendor";
}

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
    chunkSizeWarningLimit: CHUNK_SIZE_WARNING_LIMIT_KB,
    rollupOptions: {
      output: {
        manualChunks: manualChunksForVendor,
      },
    },
  },
});
