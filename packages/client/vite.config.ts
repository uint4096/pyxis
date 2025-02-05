import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import wyw from "@wyw-in-js/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  server: {
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:8080",
        secure: false,
        changeOrigin: true,
      },
      "/sync": {
        target: "http://127.0.0.1:8080",
        secure: false,
        changeOrigin: true,
      },
    },
  },
  envPrefix: [
    "VITE_",
    "TAURI_PLATFORM",
    "TAURI_ARCH",
    "TAURI_FAMILY",
    "TAURI_PLATFORM_VERSION",
    "TAURI_PLATFORM_TYPE",
    "TAURI_DEBUG",
  ],
  build: {
    target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    wyw({
      include: ["**/*.{ts,tsx}"],
      babelOptions: {
        presets: ["@babel/preset-typescript", "@babel/preset-react"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
